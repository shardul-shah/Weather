var FiveDayWeatherInfo = {}; 
var OneCallWeatherInfo = {};
var simplifiedFiveDayWeatherData = [];
var simplifiedOneCallWeatherData = [{"current": {}}, {"hourly": {}}, {"daily": {}}];
const browserTimeZone  = Intl.DateTimeFormat().resolvedOptions().timeZone;
var weather_API_key = config.WEATHER_API_KEY; //FIXME, hide API key
var google_API_key = config.GOOGLE_API_KEY; //FIXME, hide API key
var coordinates = {};

//perhaps add local time zone (e.g. PST) when outputting the time/date for the user
//use weatherAPI icons/id for pictures in the app

function retrieveJSONData() {
	var physical_location = document.getElementById("physical_location").value;
	var API_appid = "&APPID=" + weather_API_key;
	var API_url_5Day = "http://api.openweathermap.org/data/2.5/forecast?q=";
	var city="edmonton"; //FIXME
	var country="canada"; //FIXME
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
	var excludeMinutelyData = "&exclude=minutely"; 
	//the purpose of this is to exclude minutely data as it is not avaliable for every city/region in the world in this API, which makes data inconsistent (furthermore, it is not needed for a typical weather app)
	var API_url_OneCall = "http://api.openweathermap.org/data/2.5/onecall?lat="+coordinates["latitude"]+"&lon="+coordinates["longitude"]+ excludeMinutelyData+ API_appid;
	console.log(API_url_OneCall);
	console.log(coordinates);
	$.getJSON(API_url_OneCall, function(data) {
		OneCallWeatherInfo = data;
		/*the use of another function in the callback function to ensure OneCallJSONData gets updated from the first time 
		retrieveOneCallJSONData() is called (without promises). This is because of the unexpected behaviour resulting from the innate nature
		of JavaScript and callback functions being asynchronous. See: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
		Using a function to ensure synchronousity is important */
		//Side note: the importance of asychronousity is important on web browsers, as seen in the link above.
		useOneCallJSONData();
	});
};

function useOneCallJSONData() {
	console.log(OneCallWeatherInfo);
	simplifyOneCallWeatherData(OneCallWeatherInfo);
	console.log(simplifiedOneCallWeatherData);
};

function simplifyOneCallWeatherData(OneCallWeatherInfo) {
	//OneCallWeatherInfo is a list of the information of weather of a particular city, including:
	//-Current (live) weather
	//-Hourly weather for 48 hours (2 days)
	//-Daily (7 day weather) (1 dictionary for each day)

	date = new Date(OneCallWeatherInfo["current"]["dt"]*1000); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
	simplifiedOneCallWeatherData[0]["current"]["dateTime"] = convertToLocalTime(date); 
	simplifiedOneCallWeatherData[0]["current"]["currentTemp"] = OneCallWeatherInfo["current"]["temp"] - 273.15;
	simplifiedOneCallWeatherData[0]["current"]["feelsLikeTemp"] = OneCallWeatherInfo["current"]["feels_like"] - 273.15;
	simplifiedOneCallWeatherData[0]["current"]["seaLevelPressure"] = OneCallWeatherInfo["current"]["pressure"]/10; // convert hectopascal to kilopascal
	simplifiedOneCallWeatherData[0]["current"]["UVIndex"] = OneCallWeatherInfo["current"]["uvi"];
	simplifiedOneCallWeatherData[0]["current"]["cloudCover"] = OneCallWeatherInfo["current"]["clouds"];
	simplifiedOneCallWeatherData[0]["current"]["visibility"] = OneCallWeatherInfo["current"]["visibility"];
	simplifiedOneCallWeatherData[0]["current"]["windSpeed"] = OneCallWeatherInfo["current"]["wind_speed"];
	simplifiedOneCallWeatherData[0]["current"]["windGustSpeed"] = OneCallWeatherInfo["current"]["wind_gust"];
	simplifiedOneCallWeatherData[0]["current"]["description"] = OneCallWeatherInfo["current"]["weather"][0]["description"];
};

function useJSONData() {
	//console.log(FiveDayWeatherInfo);
	//console.log(typeof FiveDayWeatherInfo);
	simplifyWeatherData(FiveDayWeatherInfo);
	document.getElementById("testp3").innerHTML = JSON.stringify(simplifiedFiveDayWeatherData);
	//console.log(simplifiedFiveDayWeatherData)
};

function simplifyWeatherData(FiveDayWeatherInfo) {
	//FiveDayWeatherInfo is a list of the information of each day for 5 days of a particular city

	for (i=0; i<FiveDayWeatherInfo["list"].length; i++) {
		var weatherDataAtOneTime = {};
		date = new Date(FiveDayWeatherInfo["list"][i]["dt"]*1000); //multiply epoch time by 1000 to get the # of milliseconds; that is used to make a Date object for the epoch time
		weatherDataAtOneTime["dateTime"] = convertToLocalTime(date);
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

function convertToLocalTime(inputDate) {
	return inputDate.toLocaleString("en-US", {timeZone: browserTimeZone});
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