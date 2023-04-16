import "./main";

import * as utils from "@lib/utils";
import * as shared from "@lib/shared";
import markdown from "@lib/discord-markdown";
import Discord, { get } from "discord/main";
import * as React from "preact/compat";
import { html } from "htm/preact";
import { CHAR_REGEX, EMOJI_REGEX } from "@components/Markdown";
Object.assign(window, utils, { get, shared, utils, Discord, markdown, React, h: html, CHAR_REGEX, EMOJI_REGEX }, shared);
