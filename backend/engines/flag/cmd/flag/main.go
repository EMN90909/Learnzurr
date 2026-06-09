package main

import (
  "log"
  flagengine "learnzur/engines/flag/internal/flag"
)

func main() { log.Println(flagengine.Name() + " engine ready") }
