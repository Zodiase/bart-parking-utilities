# @xch/bart-parking-utilities

[![Build Status](https://travis-ci.com/Zodiase/bart-parking-utilities.svg?branch=master)](https://travis-ci.com/Zodiase/bart-parking-utilities)
[![Known Vulnerabilities](https://snyk.io/test/github/Zodiase/bart-parking-utilities/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Zodiase/bart-parking-utilities?targetFile=package.json)

Utilities for buying bart parking permits.

Currently it can help you buy Bart daily parking permits without visiting the website yourself. More features are getting added.

**You need to have a Select-a-Spot account first and have all necessary information added to your account. This tool currently does not allow you to provide vehicle information, mailling address or payment info.**

## Get started

```Shell
# Install globally.
> npm install -g @xch/bart-parking-utilities
# Run the utilities.
> bart
```

This is an interactive CLI. It leads you through these steps:

0. It will prompt you for username and password to login https://www.select-a-spot.com/bart/.
    If login is successful, the username and password are saved locally and encrypted with [`preferences`](https://www.npmjs.com/package/preferences) so you won't enter it again the next time.
1. Pick permit type. For now only "daily" is available.
2. Pick a Bart station. Most recently picked stations will show up first.
3. Pick a date for the permit.
4. Pick a car from your list of registered vehicles.
5. **---Warning---** You will be prompted the price of the permit and the payment method to be used for the purchase.
    **Pressing "Y" will confirm the purchase and initiate the transaction.**
6. If the purchase was successful, you will be prompted to download the permit PDF file.
