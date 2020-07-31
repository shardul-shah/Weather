var physical_location = document.getElementById("physical_location").value;

function retrieveWeatherForecast() {
	document.getElementById("test_paragraph").innerHTML = physical_location;
}