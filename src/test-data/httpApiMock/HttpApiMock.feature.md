# HTTP API Mock steps

## Header names are matched case-insensitively

Then the HTTP API Mock should have been called with

```
POST /webhook HTTP/1.1
Content-Type: application/json; charset=utf-8
X-API-Key: secret

{"foo":"bar"}
```
