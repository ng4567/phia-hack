# Introduction

Style-Me is a simple web-app made to make it easy for stylists to manage a portfolio of clients. The app provides stylists the functionality to input pictures of clothes and their clients, and then send them visualizations of the clothes on their body.

Using the FASHN Virtual Try-On API, we can return images of the clothes styled on someone's body given their picture and pictures of the clothes.

# Architecture

- Frontend: React
- Backend: Python/FastAPI
- Virtual Try-On: [FASHN Virtual Try-On v1.6](https://docs.fashn.ai/)
- LLM Provider: Microsoft Foundry
