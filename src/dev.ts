import "./main";

import * as utils from "./lib/utils";
import * as shared from "./lib/shared";
import Discord from "discord/main";
import * as React from "preact/compat";
import { html } from "htm/preact";
import { CHAR_REGEX, EMOJI_REGEX } from "./routes/Messages/Messages";

Object.assign(window, utils, { shared, utils, Discord, React, h: html, CHAR_REGEX, EMOJI_REGEX }, shared);
