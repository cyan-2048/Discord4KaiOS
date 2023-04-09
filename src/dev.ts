import "./main";

import * as utils from "./lib/utils";
import * as shared from "./lib/shared";
import Discord from "discord/main";
import * as React from "preact/compat";
import { html } from "htm/preact";

Object.assign(
	window,
	utils,
	{ shared, utils, Discord, React, h: html },
	shared
);
