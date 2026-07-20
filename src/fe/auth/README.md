# Auth Feature

The application supports two authentication modes:

- `dev`: predefined demo-user login plus student signup, backed by a locally signed session cookie.
- `cas`: SFU CAS login, with ticket validation delegated to the configured auth backend.
- `guest`: administrator-created local username/password accounts with student-equivalent permissions.

The CAS callback should be fixed and registered with SFU. Set `CAS_SERVICE_URL` to that exact URL in
deployed environments, for example `https://example.sfu.ca/api/auth/cas/callback`. The same value is
sent to both SFU CAS as the login `service` and to the auth backend during ticket validation.

The requested post-login path is stored separately in a short-lived HttpOnly cookie, so it does not
change the registered CAS service URL.

Guest users sign in on `/guest-login`. Passwords are stored as salted scrypt hashes in
`LocalCredential`; the account can be disabled or assigned an expiry time. `GUEST` remains a
distinct database account type, while a valid guest session receives the existing `student`
authorization profile so all learner workflows are reused without special-case permissions.

See `docs/guide/auth and roles.md` for endpoints, session resolution, roles, and known caveats.
