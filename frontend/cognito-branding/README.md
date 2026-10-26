# ScenarioLab Cognito branding

These assets match the dark and mint React interface. Cognito hosts the authentication pages, so these changes must be applied to the active app client in AWS. They do not take effect just by running React.

## Managed login

In Cognito, open your user pool and its **Managed login** settings. Open the style assigned to your app client and launch the branding editor. Keep the existing domain, callback, and feature plan.

Use these values for the dark theme:

| Setting | Value |
|---|---|
| Display mode | Dark |
| Page background | `#0B0C0E` |
| Form container background | `#111316` |
| Form border | `#2B3331` |
| Form corner radius | 12px |
| Input background | `#171B20` |
| Input border | `#343A43` |
| Input and heading text | `#ECEEF0` |
| Supporting text | `#A1A8B2` |
| Primary button background | `#5FE3B5` |
| Primary button text | `#0A3023` |
| Primary button hover | `#87F1C8` |
| Links and focus highlights | `#5FE3B5` |

Upload `scenariolab-logo.svg` as the form logo. Preview both sign-in and sign-up, then save the style for the app client. No separate React password form is required.

## Hosted UI (classic)

If AWS shows **Hosted UI (classic)** instead of a branding editor, upload `classic.css` in the app client's Hosted UI style settings. Classic supports only selected styling properties and does not provide the same layout controls. Its logo upload accepts PNG/JPG/JPEG, so the included SVG is intended for managed login, not the classic logo field.

## Login redirects

Keep Cognito's allowed callback URL as:

```text
http://localhost:8080/login/oauth2/code/cognito
```

Spring Boot completes authentication there, then redirects to `http://localhost:5173`. React opens login in the same tab. Restart Spring Boot after updating `AwsCognitoSecurityConfig.java`; no Cognito callback change is needed for this local flow.

References: [AWS managed login editor](https://docs.aws.amazon.com/cognito/latest/developerguide/managed-login-brandingeditor.html) and [classic branding](https://docs.aws.amazon.com/cognito/latest/developerguide/hosted-ui-classic-branding.html).
