import { Router } from "express";


// Denne må endres utifra modellen til met dataen, og hva du ønsker å lagre i databasen. Det kan være lurt å lage en egen model for dette, og kun lagre det som er relevant for web appen din.
// function mapWeatherDataToDbModel(metData: any) {
//     return {
//         timestamp: metData.time,
//         temperature: metData.data.instant.details.air_temperature,
//         windSpeed: metData.data.instant.details.wind_speed,
//         // Legg til flere felt etter behov
//     }
// }

export function createMetRouter(): Router {
  const router = Router()


  // Query parameters for lat and long
  router.get("/", async (req, res) => {
    const metData = await fetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${}&lon=${}", {
        headers: { "User-Agent": "MyWeatherApp/1.0 (https://github.com/myweatherapp)" }
    })

    // Håndering av lagring i database, sjekk migrations for tabell.
    // const weatherData = await saveWeatherData(
    //    mapWeatherDataToDbModel(metData)
    // );

    const jsonData = await metData.json()
    res.json(jsonData)
  })

  return router;
}