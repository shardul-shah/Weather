var FiveDayWeatherInfo = {}; 
var OneCallWeatherInfo = {};
var simplifiedFiveDayWeatherData = [];
var simplifiedOneCallWeatherData = [];
const browserTimeZone  = Intl.DateTimeFormat().resolvedOptions().timeZone;
var weather_API_key = "872ef0432dbc6d8ab88c0f92d85d7746"; //FIXME, hide API key
var google_API_key = "AIzaSyCTWMOEVXf6COc879LAkU8miQchsR-GZJE"; //FIXME, hide API key
var coordinates = {};


function retrieveJSONData() {
	var physical_location = document.getElementById("physical_location").value;
	var API_appid = "&APPID=" + weather_API_key;
	var API_url_5Day = "http://api.openweathermap.org/data/2.5/forecast?q=";
	var city="edmonton"; //fixme
	var country="canada"; //fixme
	geoCodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+city+country+"&key="+google_API_key;
	$.getJSON(geoCodeUrl, function(data) {
		coordinates["longitude"] = data["results"][0]["geometry"]["location"]["lng"];
		coordinates["latitude"] = data["results"][0]["geometry"]["location"]["lat"];
		retrieveOneCallJSONData();
	});

	api_url = API_url_5Day + physical_location + API_appid;
	$.getJSON(api_url, function(data) {
		FiveDayWeatherInfo = data;
		/*the use of another function in the callback function to ensure FiveDayWeatherInfo gets updated from the first time 
		retrieveJSONData() is called (without promises). This is because of the unexpected behaviour resulting from the innate nature
		of JavaScript and callback functions being asynchronous. See: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
		Using a function to ensure synchronousity is important */
		//Side note: the importance of asychronousity is important on web browsers, as seen in the link above.
		useJSONData();
	});
};

function retrieveOneCallJSONData() {
	var API_appid = "&APPID=" + weather_API_key; //can make this const global later  (and other variables)
	var API_url_OneCall = "http://api.openweathermap.org/data/2.5/onecall?lat="+coordinates["latitude"]+"&lon="+coordinates["longitude"]+API_appid;
	console.log(API_url_OneCall);
	console.log(coordinates);
	$.getJSON(api_url, function(data) {
		OneCallWeatherInfo = data;
		/*the use of another function in the callback function to ensure OneCallJSONData gets updated from the first time 
		retrieveOneCallJSONData() is called (without promises). This is because of the unexpected behaviour resulting from the innate nature
		of JavaScript and callback functions being asynchronous. See: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
		Using a function to ensure synchronousity is important */
		//Side note: the importance of asychronousity is important on web browsers, as seen in the link above.

	});
};

function useOneCallJSONData() {
	console.log(OneCallWeatherInfo);
	simplifyOneCallWeatherData(OneCallWeatherInfo);
};

function simplifyOneCallWeatherData(OneCallWeatherInfo) {
	for 
};

function useJSONData() {
	console.log(FiveDayWeatherInfo);
	console.log(typeof FiveDayWeatherInfo);
	simplifyWeatherData(FiveDayWeatherInfo);
	document.getElementById("testp3").innerHTML = JSON.stringify(simplifiedFiveDayWeatherData);
	//console.log(simplifiedFiveDayWeatherData)
};

function simplifyWeatherData(FiveDayWeatherInfo) {
	//FiveDayWeatherInfo is a list of the information of each day for 5 days of a particular city

	for (i=0; i<FiveDayWeatherInfo["list"].length; i++) {
		var weatherDataAtOneTime = {};
		time = new Date(FiveDayWeatherInfo["list"][i]["dt"]*1000);
		weatherDataAtOneTime["dateTime"] = convertToLocalTime(time);
		weatherDataAtOneTime["currentTemp"] = FiveDayWeatherInfo["list"][i]["main"]["temp"] - 273.15;
		weatherDataAtOneTime["feelsLikeTemp"] = FiveDayWeatherInfo["list"][i]["main"]["feels_like"] - 273.15;
		weatherDataAtOneTime["temp_min"] = FiveDayWeatherInfo["list"][i]["main"]["temp_min"] - 273.15;
		weatherDataAtOneTime["temp_max"] = FiveDayWeatherInfo["list"][i]["main"]["temp_max"] - 273.15;
		weatherDataAtOneTime["sea_level_pressure"] = FiveDayWeatherInfo["list"][i]["main"]["pressure"]/10; //convert hectopascal to kilopascal
		weatherDataAtOneTime["humidity"] = FiveDayWeatherInfo["list"][i]["main"]["humidity"];
		weatherDataAtOneTime["description"] = FiveDayWeatherInfo["list"][i]["weather"]["description"];
		weatherDataAtOneTime["windSpeed"] = FiveDayWeatherInfo["list"][i]["wind"]["speed"]*3.6; //convert m/s to km/h
		weatherDataAtOneTime["visibility"] = FiveDayWeatherInfo["list"][i]["visibility"]; //visibility in meters
		weatherDataAtOneTime["precipitationChance"] = FiveDayWeatherInfo["list"][i]["pop"] * 100; //convert decimal to %
		weatherDataAtOneTime["cloudCover"] = FiveDayWeatherInfo["list"][i]["clouds"]["all"] * 100; //convert decimal to %
		simplifiedFiveDayWeatherData.push(weatherDataAtOneTime);
		console.log(weatherDataAtOneTime);
	}	
};

function convertToLocalTime(inputDate) {
	return inputDate.toLocaleString("en-US", {timeZone: browserTimeZone});
};

function getCoordinates(city, country) {
	geoCodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+city+country+"&key="+google_API_key;
	console.log(geoCodeUrl);
	$.getJSON(geoCodeUrl, saveCoordinates);
};

function saveCoordinates(data) {
	coordinates["longitude"] = data["results"][0]["geometry"]["location"]["lng"];
	coordinates["latitude"] = data["results"][0]["geometry"]["location"]["lat"];
}

//FIXME make decision on whether to restrict searches to only showing city results or allow any type of search, but make a function to allow only the city to be used in the API_url
function activatePlacesSearch() {
	var physical_location = document.getElementById("physical_location");
	var autocomplete = new google.maps.places.Autocomplete(physical_location);
};