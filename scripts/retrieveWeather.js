var weather_info = "test";
var simplifiedWeatherData = [];
const browserTimeZone  = Intl.DateTimeFormat().resolvedOptions().timeZone;

function retrieveJSONData() {
	var physical_location = document.getElementById("physical_location").value;
	//document.getElementById("test_paragraph").innerHTML = physical_location;

	var API_key = "872ef0432dbc6d8ab88c0f92d85d7746";
	var API_url_domain = "http://api.openweathermap.org/data/2.5/forecast?q=";
	var API_appid = "&APPID=" + API_key;

	api_url = API_url_domain + physical_location + API_appid;
	$.getJSON(api_url, function(data) {
		weather_info = data;
		/*the use of another function in the callback function to ensure weather_info gets updated from the first time 
		retrieveJSONData() is called (without promises). This is because of the unexpected behaviour resulting from the innate nature
		of JavaScript and callback functions being asynchronous. See: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
		Using a function to ensure synchronousity is important */
		//Side note: the importance of asychronousity is important on web browsers, as seen in the link above.
		useJSONData();
	});

};

function useJSONData() {
	console.log(weather_info);
	console.log(typeof weather_info);
	simplifyWeatherData(weather_info);
	document.getElementById("testp3").innerHTML = JSON.stringify(simplifiedWeatherData);
	//console.log(simplifiedWeatherData)
};

function simplifyWeatherData(weather_info) {
	//weatherInfoOfCity is a list of the information of each day of a particular city

	for (i=0; i<weather_info["list"].length; i++) {
		var weatherDataAtOneTime = {};
		time = new Date(weather_info["list"][i]["dt"]*1000);
		weatherDataAtOneTime["dateTime"] = convertToLocalTime(time);
		weatherDataAtOneTime["currentTemp"] = weather_info["list"][i]["main"]["temp"] - 273.15;
		weatherDataAtOneTime["feelsLikeTemp"] = weather_info["list"][i]["main"]["feels_like"] - 273.15;
		weatherDataAtOneTime["temp_min"] = weather_info["list"][i]["main"]["temp_min"] - 273.15;
		weatherDataAtOneTime["temp_max"] = weather_info["list"][i]["main"]["temp_max"] - 273.15;
		weatherDataAtOneTime["sea_level_pressure"] = weather_info["list"][i]["main"]["pressure"]/10; //convert hectopascal to kilopascal
		weatherDataAtOneTime["humidity"] = weather_info["list"][i]["main"]["humidity"];
		weatherDataAtOneTime["description"] = weather_info["list"][i]["weather"]["description"];
		weatherDataAtOneTime["windSpeed"] = weather_info["list"][i]["wind"]["speed"]*3.6; //convert m/s to km/h
		weatherDataAtOneTime["visibility"] = weather_info["list"][i]["visibility"]; //visibility in meters
		weatherDataAtOneTime["precipitationChance"] = weather_info["list"][i]["pop"] * 100; //convert decimal to %
		simplifiedWeatherData.push(weatherDataAtOneTime);
		console.log(weatherDataAtOneTime);
	}	
};

function convertToLocalTime(inputDate) {
	return inputDate.toLocaleString("en-US", {timeZone: browserTimeZone});
}