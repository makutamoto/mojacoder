package main

import (
	"net/http"
	"fmt"
	"log"
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
