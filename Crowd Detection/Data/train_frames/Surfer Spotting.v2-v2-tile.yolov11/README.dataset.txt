# Surfer Spotting > v2-tile
https://universe.roboflow.com/surfline/surfer-spotting

Provided by a Roboflow user
License: Public Domain

# Overview

The Surfline Surfer Spotting dataset contains images with surfers floating on the coast. Each image contains one classification called "surfer" but may contain multiple surfers.

# Example Footage

![Surfers](https://i.imgur.com/aEQczHS.png)

# Using this Dataset

There are several deployment [options](https://universe.roboflow.com/surfline/surfer-spotting/2/try) available, including inferring via API, webcam, and curl command. 

Here is a code snippet for to hit the hosted inference API you can use. [Here are code snippets for more languages](https://docs.roboflow.com/inference/hosted-api#code-snippets)
```
const axios = require("axios");
const fs = require("fs");

const image = fs.readFileSync("YOUR_IMAGE.jpg", {
    encoding: "base64"
});

axios({
    method: "POST",
    url: "https://detect.roboflow.com/surfer-spotting/2",
    params: {
        api_key: "YOUR_KEY"
    },
    data: image,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    }
})
.then(function(response) {
    console.log(response.data);
})
.catch(function(error) {
    console.log(error.message);
});
```

## Download Dataset

On the versions tab you can select the version you like, and choose to download in 26 annotation formats.
