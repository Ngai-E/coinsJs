let assets;
let coins = '';  //will hold comma separated list of coin ids for the socket to use
let timestamps;
let refresh = true; // used to refresh the page
class crypto {
	static getAssetsInfo(callback){
		//alert('test'); //
		return fetch("https://api.coincap.io/v2/assets")
					.then(response => {
						return response.json();
					})
					.then(assets => {
						//console.log(assets);
						callback(null, assets);
					})
					.catch(e => {
						//console.log(`an error ocurred with status of ${e}`);
						callback(`Request failed. Returned status of ${e}`,null);
					})
	}

	//view users log in
	static logInfo(callback){
		//alert('test');
		return fetch("http://localhost:8080/log/view")
					.then(response => {
						return response.json();
					})
					.then(response => {
						//console.log(response);
						callback(null, response);
					})
					.catch(e => {
						//console.log(`an error ocurred with status of ${e}`);
						callback(`Request failed. Returned status of ${e}`,null);
					})
	}

	
	//save log in database
	static logUser(device, browser, ip, date, location, callback){
		//alert('test');
		return fetch(`http://localhost:8080/log/add?device=${device}&ip=${ip}&browser=${browser}&location=${location}&date=${date}`)
					.then(response => {
						//console.log(response);
						callback(null, response.status);
					})
					.catch(e => {
						//console.log(`an error ocurred with status of ${e}`);
						callback(`Request failed. Returned status of ${e}`,null);
					})
	}

}



//fetch the top 100 currencies
function fetchCoins(){
	crypto.getAssetsInfo(function (error,asset) {

		if(error){   //an error occured
			console.log(error);
		} else{
			//console.log(asset.data);
			assets = asset.data;
			timestamps = asset.timestamp;
			for (let i = 0; i < assets.length ; i ++){
				coins += `${assets[i].id},` ;
			}
			//console.log(coins);
			plotChart(5);
			fillCoinsHTML();     //design coins html
			realTimePriceSocket();
		}
	});

	crypto.logInfo(function (error,response) {

		if(error){   //an error occured
			///console.log(error);
		} else{
			
		}
	});
}  //close fetchcoins

//function to plot chart for the past seven days
function plotgraphs(url, id){
	let price = [];  //to hold the price variation in the past 7 days
	

	//console.log(url);
	fetch(url)
		.then(response => {
			return response.json();
		})
		.then(response => {
			//console.log(response);
			
			//get the prices
			for(let item of response.data){
				//console.log(Number(item.priceUsd));
				price.push(Number(item.priceUsd));
			}

			//plot
			//plot
			let data = {
					  labels:[],
					  series: [price]
					  
					};

			// Create a new line chart object where as first parameter we pass in a selector
			// that is resolving to our chart container element. The Second parameter
			// is the actual data object.
			new Chartist.Line(`#${id}`, data);

		}).catch(e => {
			console.log(e)
		});

} //end function to plot graph

//plot chart for top x crypto currencies
function plotChart(x){
	let serie = [];
	let label = [];
	let sum = 0;
	//let i;

	//loop through the asset to get the top x
	for (var i = x - 1; i >= 0; i--) {
		serie[i] = Number(assets[i].marketCapUsd);
		//console.log(serie[i])
		label[i] = assets[i].name;
		sum += serie[i];

	}

	//get percentages
	for (var i = x - 1; i >= 0; i--) {
		serie[i] = ((serie[i] / sum) * 100).toFixed(1);
		label[i] = `${label[i]} (${serie[i]}%)`;
		//console.log(serie[i])
	}
	//console.log(sum)
	//console.log(serie.length)

	//plot
	new Chart(document.getElementById("pie-chart").getContext('2d'), {
    type: 'pie',
    data: {
      labels:label,
      datasets: [{
        label: "Population (millions)",
        backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
        data: serie
      }]
    },
    options: {
      title: {
        display: true,
        text: 'Top Five Crypto Currencies By Market Capitalization'
      }
    }
});
	
}//end plot for top five crypto currencies

//change colour of percentage
function highlightChange(percent){
	if(percent.match(/[-]/i))
		return `change(24Hr):<b style="color:red;"> ${percent}%</b>`;
	else
		return `change(24Hr):<b style = "color:green;"> ${percent}%</b>`;
}//end highlighChange

//function to change the currency
function changeCurrency(currency){

	//console.log(currency);
	let url = `https://api.coincap.io/v2/rates/${currency}`;
	
	fetch(url)
		.then(response => {
			//console.log(response.json());
			return response.json()
		})
		.then(response => {
			let res = response.data.rateUsd;
			//console.log(Number(res))
			assets.forEach(function change(asset){
				let price = ((Number(asset.priceUsd)) / (Number(res)));
				let volume = (Number(asset.volumeUsd24Hr)) / (Number(res));
				let marketCap = (Number(asset.marketCapUsd)) / (Number(res));
				let vwap = (Number(asset.vwap24Hr)) / (Number(res));  //not implemented yet

				let symbol = response.data.currencySymbol;

				if(symbol === null)
					symbol = response.data.symbol;

				//fill in the change
				document.getElementById(`price${asset.id}`).innerHTML = `<b>price: ${symbol} ${price} </b>`;
				document.getElementById(`volume${asset.id}`).innerHTML = `Volume(24Hr): ${symbol} ${volume.toFixed(2)}`;
				document.getElementById(`marketCap${asset.id}`).innerHTML = `Market Cap: ${symbol} ${marketCap.toFixed(2)}`;
			});
		})
		.catch(e => {
			console.log(`error occured with error code ${e}`)
		})
}
//function to change the currency ends

//function to  return the coin with entered rank
function findRank(){
	let rank = document.getElementsByTagName('input')[0].value;
	if (isNaN(rank) || rank < 0 || rank == 0|| rank > 100)
		document.getElementById('rank').innerHTML = '[coin here]';
	else 
		document.getElementById('rank').innerHTML = assets[rank-1].name;
}//end function findRank

//flash background color to indicate increase of decrease
function flashColors(id, color){
		setTimeout(function () {
		    document.getElementById(id).style.backgroundColor = color;
		  	setTimeout(function () {
		    document.getElementById(id).style.backgroundColor = '#f5f5dc';
		  }, 5000);
		  }, 5000);

	
}

//display the coins
function fillCoinsHTML(asset = assets){
	let rows = document.getElementById('cards');
	const divcard = document.createElement('div');
	divcard.setAttribute('class', 'divcard');
	asset.forEach(function coins(coin){

		const card = document.createElement('div') //create a bootstrap card element
		card.className = 'card styleCard';
		card.setAttribute('id', `${coin.id}`);

 		const logo = document.createElement('img'); // create the crytocurrency logo
 		//logo.setAttribute('src', `https://chasing-coins.com/api/v1/std/logo/${coin.symbol}`); //https://chasing-coins.com/coin/logo/
 		logo.setAttribute('src', `https://chasing-coins.com/coin/logo/${coin.symbol}`);
 		//logo.className = 'card-img-top cryto-image';
 		logo.setAttribute('class', `card-img-top`);
 		logo.setAttribute("style", "width:60px;align-self: center;margin-top: 20px;" )
 		logo.setAttribute('alt', `${coin.id} logo`);

 		const cardBody = document.createElement('div'); //create the bootstrap 4 card-body
 		cardBody.setAttribute('class', 'card-body');
 		cardBody.innerHTML = `<h4 class="card-title">${coin.rank}. ${coin.name} <small>(${coin.symbol})</small></h4>
            <p class="card-text">
              <span style="display: block;" id = 'price${coin.id}'><b>price: $ ${Number(coin.priceUsd)} </b></span>
              <span style="display: block;">${highlightChange(Number(coin.changePercent24Hr).toFixed(2))}</span>
              <span style="display: block;">Supply: ${Number(coin.supply).toFixed(2)}</span>
              <span style="display: block;" id = 'volume${coin.id}'>Volume(24Hr): $ ${Number(coin.volumeUsd24Hr).toFixed(2)}</span>
              <span style="display: block;" id = 'marketCap${coin.id}'>Market Cap: $ ${Number(coin.marketCapUsd).toFixed(2)}</span>
            </p>
            <div class = 'graph' id= '${coin.id}'>Price Graph (7d)</div>`;

        card.append(logo);
        card.append(cardBody);

        divcard.append(card);


	});

	rows.innerHTML = divcard.innerHTML;
	

	//display the graph
	let graph = document.getElementsByClassName('graph');
	for (var div = 0; div < graph.length; div++) {
		//console.log(graph[div].id);
		plotgraphs(`https://api.coincap.io/v2/assets/${graph[div].id}/history?interval=h12&start=
			${new Date().setDate(new Date().getDate()-7)}&end=${new Date().getTime()}`, graph[div].id)
	}
	// for (let div of graph){
	// 	console.log(div.id);
	// 	plotgraphs(`https://api.coincap.io/v2/assets/${div.id}/history?interval=h12&start=
	// 		${new Date().setDate(new Date().getDate()-7)}&end=${new Date().getTime()}`)
	// }

} //end function to display coins



document.addEventListener('DOMContentLoaded', function () {
	fetch('https://ipapi.co/json/')   //get the location of client logged into site
	.then(response => {
		return response.json();
	})
	.then(response => {
		//console.log(response);
		
		let device, browser = '', ip, date, location;

		//get the browser type and version
		let browsers = bowser;
		//console.log(browsers);
		for (const key of Object.keys(browsers)) {
			if (key != 'version')
				if(key != 'webkit')
					if(key != 'a')
						if(key != 'gecko')
    						browser += key.toString() + " " ;


		}
			browser += 'version' + " " + browsers.version; 
		//console.log(browser);

		//get the ip 
		ip = response.ip;

		//get the location
		location = `${response.country_name},${response.city} (latitude: ${response.latitude}, longitude: ${response.longitude})`;


		//get the date logged in
		date = new Date();
		date = date.toString() + '';

		//get Device type
		if(navigator.userAgent.match(/mobile/i)) {
			device = navigator.platform + ' on ' + 'Mobile Phone'; 
		} else if (navigator.userAgent.match(/iPad|Android|Touch/i)) {
				device = navigator.platform + ' on ' + 'Tablet';
		} else {
			device = navigator.platform + ' on ' + 'desktop computer';
			}
		

		//console.log(device, date, ip, location, browser);

		crypto.logUser(device, browser, ip, date, location, function(error, success){
			if(error){
				console.log(` ${error}`)
			}
			else{
				console.log(success);
			}
		});
	})
	.catch(e => {
		console.log(`the location fetch request failed with error ${e}`);
	})


	

});

// close DOMContentLoaded

//socket for real time price update
function realTimePriceSocket(){
	const prices = new WebSocket(`wss://ws.coincap.io/prices?assets=${coins}`);


	//high: #689a74, low: #e8939c
    prices.onmessage = function (msg1) { 
    	var msg = JSON.parse(msg1.data);
    	   // console.log(msg)
    		setTimeout(function () {
		    
	        for(let i = 0; i < assets.length; i ++){
	        	if(msg[assets[i].id]!= undefined)
	        	{
	        		if(Number(assets[i].priceUsd) < Number(msg[assets[i].id])){
	        	        		flashColors(assets[i].id, '#689a74' )
	        	        		document.getElementById(`price${assets[i].id}`).innerHTML = `<b>price: $ ${Number(msg[assets[i].id])} </b>`;
	        	    }
	        	    else if(Number(assets[i].priceUsd) > Number(msg[assets[i].id])){
	        	        		flashColors(assets[i].id, '#e8939c' );
	        	        		document.getElementById(`price${assets[i].id}`).innerHTML = `<b>price: $ ${Number(msg[assets[i].id])} </b>`;
	        	    }
	        	}
        }

		  }, 5000); 
        
        fetchCoins();  // test

    }
} //end real time price

//this function refreshes the coins incase ranks have changed every 5 minute
function refresh1(){
	if(refresh === true)
	{
		setTimeout(function (){
		  refresh = false;
		  refresh1();
		},60000);
	}

	else
	{
		fetchCoins();
		refresh = true;
		refresh1();
	}


}

fetchCoins();  // test

refresh1();



