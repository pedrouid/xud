#!/bin/bash
set -ex
source .env
API_PORT=$1
RESOLVER_PORT=$2
./start-raiden.sh "$RAIDEN_DATA_DIR_ALICE" "$API_PORT" "$RESOLVER_PORT"
