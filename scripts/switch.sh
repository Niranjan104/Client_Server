#!/bin/sh

TARGET=$1

if [ "$TARGET" = "green" ]; then
    cp /etc/nginx/conf.d/green.conf /etc/nginx/conf.d/active.conf
elif [ "$TARGET" = "blue" ]; then
    cp /etc/nginx/conf.d/blue.conf /etc/nginx/conf.d/active.conf
else
    echo "Invalid target"
    exit 1
fi

nginx -s reload
echo "Switched to $TARGET"
