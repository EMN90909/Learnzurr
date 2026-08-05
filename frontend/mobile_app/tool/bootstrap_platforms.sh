#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
flutter create . \
  --project-name learnzurr_mobile \
  --org io.learnzurr \
  --platforms android,ios \
  --overwrite
flutter pub get

echo "Android and iOS runners generated. Restore or review any local signing settings before release builds."
