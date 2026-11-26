# nRF Cloud API mock steps

## Header names of requests are matched case-insensitively

Then the nRF Cloud API should have been called with

```
PATCH /v1/devices/some-device/state HTTP/1.1
content-type: application/json
x-request-id: 42

{"desired":{"foo":"bar"}}
```

## The Authorization header is matched case-insensitively

Then the shadow for `some-device` in the `elite` account has been requested
