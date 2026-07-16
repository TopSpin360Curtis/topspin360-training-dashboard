# TopSpin360 Auth V2 Preview

This is a background-only authentication track for self-managed passwords, email verification,
and future password resets. It does **not** replace the current live Lions/Test/Texans login flow.

## What this adds

- Parallel auth preview routes under `/auth-v2`
- Clerk-based sign in and sign up
- Email verification and password reset support through Clerk
- Team-restricted preview dashboard access based on Clerk user metadata
- Account settings page for future password and email management

## Required Vercel environment variables

```text
AUTH_V2_ENABLED=true
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth-v2/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth-v2/sign-up
```

## Preview routes

```text
/auth-v2
/auth-v2/lions
/auth-v2/texans
/auth-v2/test
/auth-v2/sign-in
/auth-v2/sign-up
/auth-v2/account
```

## Clerk user metadata for team access

Each Clerk user should include dashboard access metadata like:

```json
{
  "dashboardTenantIds": ["lions"],
  "dashboardRole": "member",
  "dashboardCanExport": true
}
```

Supported fields in the preview helper:

- `dashboardTenantIds`
- `dashboardTenantId`
- `dashboardRole`
- `dashboardCanExport`

## How the future first-login flow works

Recommended rollout pattern:

1. Admin invites user by email from Clerk
2. User accepts invite
3. User verifies email
4. User creates their own password
5. User signs in through their team route
6. Future password resets are handled by Clerk email recovery

## Important rollout note

Do not point the live `/login/*` routes at Clerk yet. Keep rollout separate until:

- tenant metadata is assigned for all users
- sign-in flow is visually approved
- password reset emails are tested
- team isolation is validated with real accounts
