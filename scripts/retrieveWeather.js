var FiveDayWeatherInfo = {}; 
var OneCallWeatherInfo = {};
var historicalOneCallWeatherInfo = [];

var simplifiedFiveDayWeatherData = [];
var simplifiedOneCallWeatherData = [{"current": []}, {"hourly": []}, {"daily": []}];
var simplifiedHistoricalOneCallWeatherData = []; //only stores historical hourly data. This variable is a list of lists of dictionaries. Each list in this list represents one day of past weather information.

const browserTimeZone  = Intl.DateTimeFormat().resolvedOptions().timeZone;
var weather_API_key = config.WEATHER_API_KEY; //FIXME, hide API key
var google_API_key = config.GOOGLE_API_KEY; //FIXME, hide API key
var coordinates = {};

//TODO LIST
//perhaps add local time zone (e.g. PST) when outputting the time/date for the user
//use weatherAPI icons/id for pictures in the app
//Convert units from imperial to metric and metric to imperial depending on user preferences (maybe a switch).
//(CHECK AVALIABLE TAGS) Wind gust, daily.rain, daily.snow is not avaliable everywhere, maybe adjust it for places that don't have wind gust data or remove that completely

function retrieveJSONData() {
	//everytime weather information is retrieved for a city, the following global variables must be reinitialized to being empty
	simplifiedFiveDayWeatherData = [];
	simplifiedOneCallWeatherData = [{"current": []}, {"hourly": []}, {"daily": []}];
	simplifiedHistoricalOneCallWeatherData = []; //only stores historical hourly data. This variable is a list of lists of dictionaries. Each list in this list represents one day of past weather information.
	historicalOneCallWeatherInfo = []; //furthermore, this variable must be reinitialized to empty as the JSON data is pushed to the list, not assigned

	var physical_location = document.getElementById("physical_location").value;
	var API_appid = "&APPID=" + weather_API_key;
	var API_url_5Day = "https://api.openweathermap.org/data/2.5/forecast?q=";
	var city="edmonton"; //FIXME
	var country="canada"; //FIXME
	var geoCodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+city+country+"&key="+google_API_key;


	$.getJSON(geoCodeUrl).done(function(data) {
		coordinates["longitude"] = data["results"][0]["geometry"]["location"]["lng"];
		coordinates["latitude"] = data["results"][0]["geometry"]["location"]["lat"];
		//retrieveOneCallJSONData();
	}).then(function() {
  		//present+Future data API call
		var API_appid = "&APPID=" + weather_API_key; //can make this const global later  (and other variables)
		var excludeMinutelyData = "&exclude=minutely"; 
		//the purpose of this is to exclude minutely data as it is not avaliable for every city/region in the world in this API, which makes data inconsistent (furthermore, it is not needed for a typical weather app)
		var API_url_OneCall = "https://api.openweathermap.org/data/2.5/onecall?lat="+coordinates["latitude"]+"&lon="+coordinates["longitude"]+ excludeMinutelyData+ API_appid;
		console.log(API_url_OneCall);
		console.log(coordinates);

		$.getJSON(API_url_OneCall).done(function(data) {
		OneCallWeatherInfo = data;
		/*then() used to ensure  */
		}).then(function() {
			console.log(OneCallWeatherInfo);
			simplifyOneCallWeatherData(OneCallWeatherInfo);
			console.log(simplifiedOneCallWeatherData);
		});

		//past data API call
		var currentEpochTime = Math.floor((new Date()).getTime()/1000); //find currentEpochTime in seconds (divide by 1000 for ms -> s)
		const numSecondsInOneDay = 86400;
		var promises = [];
		for (let i=0; i<6; i++) { //retrieve weather information for some hours of today and the last 5 days before today
			var API_url_Historical_OneCall = "https://api.openweathermap.org/data/2.5/onecall/timemachine?lat="+coordinates["latitude"]+"&lon="+coordinates["longitude"]+"&dt="+currentEpochTime+API_appid;
			// $.getJSON returns a promise
			promises.push($.getJSON(API_url_Historical_OneCall));
			console.log(new Date(currentEpochTime*1000));
			console.log(API_url_Historical_OneCall);
			//console.log(currentEpochTime);
			currentEpochTime-=numSecondsInOneDay; //go back a day to retrieve the weather information for the past day
		}

		$.when.apply($, promises).then(function(){
		    // This callback will be passed the result of each AJAX call as a parameter
		    for(var i = 0; i < arguments.length; i++) {
		        // arguments[i][0] is needed because each argument
		        // is an array of 3 elements.
		        // The data, the status, and the jqXHR object
		        historicalOneCallWeatherInfo.push(arguments[i][0]);
    		}
   	 		console.log(historicalOneCallWeatherInfo);
		}).then(function() {
			console.log(historicalOneCallWeatherInfo);
			console.log(historicalOneCallWeatherInfo.length.toString());
			simplifyHistoricalOneCallWeatherInfo(historicalOneCallWeatherInfo);
			console.log(simplifiedHistoricalOneCallWeatherData);
		});
		

		api_url = API_url_5Day + physical_location + API_appid;
		$.getJSON(api_url).done(function(data) {
		FiveDayWeatherInfo = data;
		/*the use of another function in the callback function to ensure FiveDayWeatherInfo gets updated from the first time 
		retrieveJSONData() is called (without promises). This is because of the unexpected behaviour resulting from the innate nature
		of JavaScript and callback functions being asynchronous. See: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
		Using a function to ensure synchronousity is important */
		//Side note: the importance of asychronousity is important on web browsers, as seen in the link above.
		}).then(function() { 
		simplifyWeatherData(FiveDayWeatherInfo);
		}).then(function() { //FIXME UNSURE IF THESE THENS AFTER THE SIMPLIFY...DATA ARE NECCESARY (HERE AND ABOVE)
		document.getElementById("testp3").innerHTML = JSON.stringify(simplifiedFiveDayWeatherData);
		console.log(simplifiedFiveDayWeatherData);
		});

	}).then(function() {
  		console.log("last:" + new Date().getTime())
	});
};

function test() {
	console.log(simplifiedFiveDayWeatherData);
	console.log(simplifiedOneCallWeatherData);
	console.log(simplifiedHistoricalOneCallWeatherData);
}

function simplifyHistoricalOneCallWeatherInfo(historicalOneCallWeatherInfo) {
	//historicalOneCallWeatherInfo is a list of the information of weather of a particular city, including:
	//-Weather at the requested time - "current" (I will not be storing this)
	//-Hourly weather information for the day of the requested time (I will be storing this)
	console.log(JSON.stringify(historicalOneCallWeatherInfo));
	console.log(historicalOneCallWeatherInfo.length.toString());
	for (var j = 0; j<historicalOneCallWeatherInfo.length; j++) {
		var historicalDailyWeatherData = []; //weatherData for one day

		if (!("hourly" in historicalOneCallWeatherInfo[j])) {
			continue;
		}

		for (var i = 0; i<historicalOneCallWeatherInfo[j]["hourly"].length; i++) {
			var historicalHourlyWeatherData = {}; //weatherData for one hour
			historicalHourlyWeatherData["dateTime"] = convertToSpecifiedTimeZone(new Date(historicalOneCallWeatherInfo[j]["hourly"][i]["dt"]*1000), browserTimeZone); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
			historicalHourlyWeatherData["currentTemp"] = historicalOneCallWeatherInfo[j]["hourly"][i]["temp"] - 273.15;
			historicalHourlyWeatherData["feelsLikeTemp"] = historicalOneCallWeatherInfo[j]["hourly"][i]["feels_like"] - 273.15;
			historicalHourlyWeatherData["seaLevelPressure"] = historicalOneCallWeatherInfo[j]["hourly"][i]["pressure"]/10; //convert hectopascal to kilopascal
			historicalHourlyWeatherData["humidity"] = historicalOneCallWeatherInfo[j]["hourly"][i]["humidity"];
			historicalHourlyWeatherData["description"] = historicalOneCallWeatherInfo[j]["hourly"][i]["weather"]["description"];
			historicalHourlyWeatherData["windSpeed"] = historicalOneCallWeatherInfo[j]["hourly"][i]["wind_speed"]*3.6; //convert m/s to km/h
			historicalHourlyWeatherData["visibility"] = historicalOneCallWeatherInfo[j]["hourly"][i]["visibility"]; //visibility in meters
			historicalHourlyWeatherData["precipitationChance"] = historicalOneCallWeatherInfo[j]["hourly"][i]["pop"] * 100; //convert decimal to %
			historicalHourlyWeatherData["cloudCover"] = historicalOneCallWeatherInfo[j]["hourly"][i]["clouds"]["all"] * 100; //convert decimal to %
			historicalDailyWeatherData.push(historicalHourlyWeatherData);
		}
		simplifiedHistoricalOneCallWeatherData.push(historicalDailyWeatherData);	
	}
	console.log(simplifiedHistoricalOneCallWeatherData);
	console.log(historicalOneCallWeatherInfo.length);
};

function simplifyOneCallWeatherData(OneCallWeatherInfo) {
	//OneCallWeatherInfo is a list of the information of weather of a particular city, including:
	//-Current (live) weather
	//-Hourly weather for 48 hours (2 days)
	//-Daily (7 day weather) (1 dictionary for each day)

	var currentWeatherData = {};
	currentWeatherData["dateTime"] = convertToSpecifiedTimeZone(new Date(OneCallWeatherInfo["current"]["dt"]*1000), browserTimeZone); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time); 
	currentWeatherData["currentTemp"] = OneCallWeatherInfo["current"]["temp"] - 273.15;
	currentWeatherData["feelsLikeTemp"] = OneCallWeatherInfo["current"]["feels_like"] - 273.15;
	currentWeatherData["seaLevelPressure"] = OneCallWeatherInfo["current"]["pressure"]/10; // convert hectopascal to kilopascal
	currentWeatherData["UVIndex"] = OneCallWeatherInfo["current"]["uvi"];
	currentWeatherData["cloudCover"] = OneCallWeatherInfo["current"]["clouds"]*100; //convert decimal to %
	currentWeatherData["visibility"] = OneCallWeatherInfo["current"]["visibility"]; //visibility in meters
	currentWeatherData["windSpeed"] = OneCallWeatherInfo["current"]["wind_speed"]*3.6; //convert m/s to km/h
	currentWeatherData["description"] = OneCallWeatherInfo["current"]["weather"][0]["description"];

	if ("wind_gust" in OneCallWeatherInfo["current"]) { //if wind_gust data avaliable
		currentWeatherData["windGustSpeed"] = OneCallWeatherInfo["current"]["wind_gust"]*3.6; //convert m/s to km/h; current wind gust speed

	}	

	if ("rain" in OneCallWeatherInfo["current"]) { //if rainVolume data avaliable
		currentWeatherData["rainVolume"] = OneCallWeatherInfo["current"]["rain"]["1h"]; //rain volume in last hour in mm
	}
	
	if ("snow" in OneCallWeatherInfo["current"]) { //if snowVolume data avaliable 
		currentWeatherData["snowVolume"] =  OneCallWeatherInfo["current"]["snow"]["1h"]; //snow volume in last hour in mm
	}
	simplifiedOneCallWeatherData[0]["current"].push(currentWeatherData);

	for (var i=0; i<OneCallWeatherInfo["hourly"].length; i++) {
		var hourlyWeatherData = {};
		hourlyWeatherData["dateTime"] = convertToSpecifiedTimeZone(new Date(OneCallWeatherInfo["hourly"][i]["dt"]*1000), browserTimeZone); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time); 
		hourlyWeatherData["currentTemp"] = OneCallWeatherInfo["hourly"][i]["temp"] - 273.15;
		hourlyWeatherData["feelsLikeTemp"] = OneCallWeatherInfo["hourly"][i]["feels_like"] - 273.15;
		hourlyWeatherData["seaLevelPressure"] = OneCallWeatherInfo["hourly"][i]["pressure"]/10; //convert hectopascal to kilopascal
		hourlyWeatherData["humidity"] = OneCallWeatherInfo["hourly"][i]["humidity"];
		hourlyWeatherData["cloudCover"] = OneCallWeatherInfo["hourly"][i]["clouds"] * 100; //convert decimal to %
		hourlyWeatherData["visibility"] = OneCallWeatherInfo["hourly"][i]["visibility"]; //visibility in meters
		hourlyWeatherData["windSpeed"] = OneCallWeatherInfo["hourly"][i]["wind_speed"] * 3.6; //convert m/s to km/h
		hourlyWeatherData["description"] = OneCallWeatherInfo["hourly"][i]["weather"][0]["description"];
		hourlyWeatherData["precipitationChance"] = OneCallWeatherInfo["hourly"][i]["pop"] * 100; //convert decimal to %

		if ("wind_gust" in OneCallWeatherInfo["hourly"][i]) { //if wind_gust data avaliable
			hourlyWeatherData["windGustSpeed"] = OneCallWeatherInfo["hourly"][i]["wind_gust"]*3.6; //convert m/s to km/h; wind gust speed in the last hour
		}	

		if ("rain" in OneCallWeatherInfo["hourly"][i]) {//if rainVolume data avaliable 
			hourlyWeatherData["rainVolume"] = OneCallWeatherInfo["hourly"][i]["rain"]["1h"]; //rain volume in last hour in mm
		}
		
		if ("snow" in OneCallWeatherInfo["hourly"][i]) { //if snowVolume data avaliable 
			hourlyWeatherData["snowVolume"] =  OneCallWeatherInfo["hourly"][i]["snow"]["1h"]; //snow volume in last hour in mm
		}
		simplifiedOneCallWeatherData[1]["hourly"].push(hourlyWeatherData);
	}

	for (var i=0; i<OneCallWeatherInfo["daily"].length; i++) {
		var dailyWeatherData = {};
		//note: 
		//dateTime is the time of the weather entry in the user's local time.
		//sunriseTime and sunsetTime are the times of sunrise and sunset in the time zone of the city entered
		dailyWeatherData["datetime"] = convertToSpecifiedTimeZone(new Date(OneCallWeatherInfo["daily"][i]["dt"]*1000), browserTimeZone); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
		dailyWeatherData["sunriseTime"] = convertToSpecifiedTimeZone(new Date(OneCallWeatherInfo["daily"][i]["sunrise"]*1000), OneCallWeatherInfo["timezone"]); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
		dailyWeatherData["sunsetTime"] = convertToSpecifiedTimeZone(new Date(OneCallWeatherInfo["daily"][i]["sunset"]*1000), OneCallWeatherInfo["timezone"]); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
		dailyWeatherData["morningTemp"] = OneCallWeatherInfo["daily"][i]["temp"]["morn"] - 273.15;
		dailyWeatherData["feelsLikeMorningTemp"] = OneCallWeatherInfo["daily"][i]["feels_like"]["morn"] - 273.15;
		dailyWeatherData["afternoonTemp"] = OneCallWeatherInfo["daily"][i]["temp"]["day"] - 273.15;
		dailyWeatherData["feelsLikeAfternoonTemp"] = OneCallWeatherInfo["daily"][i]["feels_like"]["day"] - 273.15;
		dailyWeatherData["eveningTemp"] = OneCallWeatherInfo["daily"][i]["temp"]["eve"] - 273.15;
		dailyWeatherData["feelsLikeEveningTemp"] = OneCallWeatherInfo["daily"][i]["feels_like"]["eve"] - 273.15;
		dailyWeatherData["nightTemp"] = OneCallWeatherInfo["daily"][i]["temp"]["night"] - 273.15;
		dailyWeatherData["feelsLikeNightTemp"] = OneCallWeatherInfo["daily"][i]["feels_like"]["night"] - 273.15;
		dailyWeatherData["dailyMinTemp"] = OneCallWeatherInfo["daily"][i]["temp"]["min"] - 273.15;
		dailyWeatherData["dailyMaxTemp"] = OneCallWeatherInfo["daily"][i]["temp"]["max"] - 273.15;
		dailyWeatherData["humidity"] = OneCallWeatherInfo["daily"][i]["humidity"];
		dailyWeatherData["pressure"] = OneCallWeatherInfo["daily"][i]["pressure"]/10; //convert hectopascal to kilopascal
		dailyWeatherData["windSpeed"] = OneCallWeatherInfo["daily"][i]["wind_speed"]*3.6; //convert m/s to km/h
		dailyWeatherData["windGustSpeed"] = OneCallWeatherInfo["daily"][i]["wind_gust"]*3.6; //WHERE AVALIABLE //convert m/s to km/h
		dailyWeatherData["description"] = OneCallWeatherInfo["daily"][i]["weather"]["description"];
		dailyWeatherData["cloudCover"] = OneCallWeatherInfo["daily"][i]["clouds"] * 100; //convert decimal to %
		dailyWeatherData["precipitationChance"] = OneCallWeatherInfo["daily"][i]["pop"]*100; //convert decimal to %
		dailyWeatherData["rainVolume"] = OneCallWeatherInfo["daily"][i]["rain"]; //WHERE AVALIABLE //unit: mm
		dailyWeatherData["snowVolume"] = OneCallWeatherInfo["daily"][i]["snow"]; //WHERE AVALIABLE //unit: mm
		dailyWeatherData["UVIndex"] = OneCallWeatherInfo["daily"][i]["uvi"];

		if ("wind_gust" in OneCallWeatherInfo["daily"][i]) { //if wind_gust data avaliable
			dailyWeatherData["windGustSpeed"] = OneCallWeatherInfo["daily"][i]["wind_gust"]*3.6; //convert m/s to km/h; average daily wind gust speed
		}	

		if ("rain" in OneCallWeatherInfo["daily"][i]) {//if rainVolume data avaliable 
			dailyWeatherData["rainVolume"] = OneCallWeatherInfo["daily"][i]["rain"]["1h"]; //rain volume in last hour in mm
		}
		
		if ("snow" in OneCallWeatherInfo["daily"][i]) { //if snowVolume data avaliable 
			dailyWeatherData["snowVolume"] =  OneCallWeatherInfo["daily"][i]["snow"]["1h"]; //snow volume in last hour in mm
		}
		simplifiedOneCallWeatherData[2]["daily"].push(dailyWeatherData);
 	}	
};

function simplifyWeatherData(FiveDayWeatherInfo) {
	//FiveDayWeatherInfo is a list of the information of each day for 5 days of a particular city

	for (var i=0; i<FiveDayWeatherInfo["list"].length; i++) {
		var weatherDataAtOneTime = {}; 
		weatherDataAtOneTime["dateTime"] = convertToSpecifiedTimeZone(new Date(FiveDayWeatherInfo["list"][i]["dt"]*1000), browserTimeZone); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
		weatherDataAtOneTime["currentTemp"] = FiveDayWeatherInfo["list"][i]["main"]["temp"] - 273.15;
		weatherDataAtOneTime["feelsLikeTemp"] = FiveDayWeatherInfo["list"][i]["main"]["feels_like"] - 273.15;
		weatherDataAtOneTime["temp_min"] = FiveDayWeatherInfo["list"][i]["main"]["temp_min"] - 273.15;
		weatherDataAtOneTime["temp_max"] = FiveDayWeatherInfo["list"][i]["main"]["temp_max"] - 273.15;
		weatherDataAtOneTime["seaLevelPressure"] = FiveDayWeatherInfo["list"][i]["main"]["pressure"]/10; //convert hectopascal to kilopascal
		weatherDataAtOneTime["humidity"] = FiveDayWeatherInfo["list"][i]["main"]["humidity"];
		weatherDataAtOneTime["description"] = FiveDayWeatherInfo["list"][i]["weather"]["description"];
		weatherDataAtOneTime["windSpeed"] = FiveDayWeatherInfo["list"][i]["wind"]["speed"]*3.6; //convert m/s to km/h
		weatherDataAtOneTime["visibility"] = FiveDayWeatherInfo["list"][i]["visibility"]; //visibility in meters
		weatherDataAtOneTime["precipitationChance"] = FiveDayWeatherInfo["list"][i]["pop"] * 100; //convert decimal to %
		weatherDataAtOneTime["cloudCover"] = FiveDayWeatherInfo["list"][i]["clouds"]["all"] * 100; //convert decimal to %
		simplifiedFiveDayWeatherData.push(weatherDataAtOneTime);
		//console.log(weatherDataAtOneTime);
	}	
};

function convertToSpecifiedTimeZone(inputDate, inputTimeZone) {
	return inputDate.toLocaleString("en-US", {timeZone: inputTimeZone});
};

function getCoordinates(city, country) {
	geoCodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+city+country+"&key="+google_API_key;
	console.log(geoCodeUrl);
	$.getJSON(geoCodeUrl, saveCoordinates);
};


//FIXME make decision on whether to restrict searches to only showing city results or allow any type of search, but make a function to allow only the city to be used in the API_url
function activatePlacesSearch() {
	var physical_location = document.getElementById("physical_location");
	var autocomplete = new google.maps.places.Autocomplete(physical_location);
};