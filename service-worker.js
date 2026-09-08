const CACHE_NAME = "notes-app-v1";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./app.js",

    "./manifest.json",

    "./icon.png"

];


self.addEventListener(
    "install",
    function(event) {

        event.waitUntil(

            caches.open(CACHE_NAME)

                .then(function(cache) {

                    return cache.addAll(
                        FILES_TO_CACHE
                    );

                })

        );

    }
);


self.addEventListener(
    "fetch",
    function(event) {

        event.respondWith(

            caches.match(event.request)

                .then(function(response) {

                    if (response) {

                        return response;

                    }

                    return fetch(event.request);

                })

        );

    }
);



