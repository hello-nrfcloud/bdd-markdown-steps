---
exampleContext:
  endpoint: https://api.example.com/
---

# REST steps

## Simple request

When I `GET` `${endpoint}/foo`

Then I should receive a
`https://github.com/hello-nrfcloud/bdd-markdown-steps/tests` response

And the status code of the last response should be `200`

## Setting headers

Given the `Authorization` header of the next request is `Bearer BAR`

When I `POST` to `${endpoint}/bar`

Then I should receive a
`https://github.com/hello-nrfcloud/bdd-markdown-steps/tests` response

And the status code of the last response should be `200`
