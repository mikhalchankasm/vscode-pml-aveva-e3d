# Security Policy

## Supported Versions

We support the following extension versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| < 0.4   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, **DO NOT** create a public issue.

### How to Report

1. **Email:** Send description to [add email]
2. **GitHub Security Advisories:** Use the "Security" tab in the repository

### What to Include

- Vulnerability description
- Steps to reproduce
- Potential impact
- Possible solution (if any)

### Process

1. We'll confirm receipt within 48 hours
2. We'll assess the issue and determine severity
3. We'll develop a fix
4. We'll release a patch and publicly announce the vulnerability

### Acknowledgments

We'll publicly thank security researchers who discover vulnerabilities (if they wish).

## Data Security

### What We DON'T Collect

- ❌ PML source code
- ❌ File names or paths
- ❌ Personal data
- ❌ AVEVA E3D project data

### Telemetry

The extension uses standard VS Code telemetry (can be disabled):

```json
{
  "telemetry.telemetryLevel": "off"
}
```

Details: [TELEMETRY.md](TELEMETRY.md) (coming soon)

## Known Limitations

- Extension works only locally in VS Code
- Does not require network access
- Does not send data to external servers

---

Thank you for helping keep the project secure! 🔒
