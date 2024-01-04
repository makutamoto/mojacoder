package main

import (
	"fmt"
	"log"
	"net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "alive")
}

func health() {
	http.HandleFunc("/health", healthHandler)
	go func() {
		err := http.ListenAndServe(":3000", nil)
		if err != nil {
			log.Println(err)
		}
	}()
}
