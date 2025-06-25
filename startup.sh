#!/bin/bash
set -e  # stop on any error

# install system dependencies
apt-get update
apt-get install -y nodejs npm             # or any other packages you need

# install project dependencies
npm ci                                    # or yarn/pnpm install, etc.

# run any initial setup commands
npm run build                             # optional
