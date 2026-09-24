function dceGetElementSettings($element) {
	var elementSettings = [];
	var modelCID = $element.data("model-cid");
	if (elementorFrontend.isEditMode() && modelCID) {
		var settings = elementorFrontend.config.elements.data[modelCID];
		var type = settings.attributes.widgetType || settings.attributes.elType;
		var settingsKeys = elementorFrontend.config.elements.keys[type];
		if (!settingsKeys) {
			settingsKeys = elementorFrontend.config.elements.keys[type] = [];
			jQuery.each(settings.controls, function (name, control) {
				if (control.frontend_available) {
					settingsKeys.push(name);
				}
			});
		}
		jQuery.each(settings.getActiveControls(), function (controlKey) {
			if (-1 !== settingsKeys.indexOf(controlKey)) {
				elementSettings[controlKey] = settings.attributes[controlKey];
			}
		});
	} else {
		elementSettings = $element.data("settings") || {};
	}
	return elementSettings;
}

function dceObserveElement($target, $function_callback) {
	if (!elementorFrontend.isEditMode()) {
		return;
	}

	const config = {
		attributes: true,
		childList: false,
		characterData: true,
	};

	const MutationObserver =
		window.MutationObserver ||
		window.WebKitMutationObserver ||
		window.MozMutationObserver;
	const observer = new MutationObserver($function_callback);

	observer.observe($target, config);
}

window.dynamicooo = {};

/**
 * SPDX-SnippetBegin
 * SPDX-FileCopyrightText: Elementor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
dynamicooo.getActiveBreakpointsMinPointAndPostfix = () => {
	let breakpoints = elementorFrontend.config.responsive.activeBreakpoints;
	let ret = {};
	for (let key in breakpoints) {
		ret[key] = {
			// Elementor widescreen value is actually the min breakpoint:
			min_point:
				elementorFrontend.breakpoints.getDeviceMinBreakpoint(key),
			postfix: `_${key}`,
		};
	}
	ret.desktop = {
		min_point:
			elementorFrontend.breakpoints.getDeviceMinBreakpoint("desktop"),
		postfix: "",
	};
	return ret;
};
/**
 * SPDX-SnippetEnd
 */

/**
 * Create a Swiper settings breakpoints object
 *
 * swiperSettings: An object with with Swiper settings keys as keys, and as values
 *  an object contains:
 * - elementor_key: The Elementor Settings Key from where the value of the
 *    Swiper Key should be fetched.
 * - default_value
 *
 *
 *  Returns the breakpoints object as defined by Swiper, value are
 *  automatically fetched from the Elementor settings.
 */
dynamicooo.makeSwiperBreakpoints = (
	swiperSettings,
	elementorSettings,
	prefix = "",
) => {
	const elementorBreakpoints =
		dynamicooo.getActiveBreakpointsMinPointAndPostfix();
	const breakpoints = {};
	const lastBreakpointValues = {};

	Object.keys(elementorBreakpoints)
		.reverse()
		.forEach((breakpointName) => {
			let min_point = elementorBreakpoints[breakpointName].min_point;

			if (elementorBreakpoints[breakpointName].postfix === "_mobile") {
				min_point = 0;
			}

			let breakpointSettings = {};

			for (let swiperSettingsKey in swiperSettings) {
				const setting = swiperSettings[swiperSettingsKey];
				const defaultValue = setting.default_value;
				const elementorKeyWithPostfix =
					prefix +
					setting.elementor_key +
					elementorBreakpoints[breakpointName].postfix;
				let value = elementorSettings[elementorKeyWithPostfix];

				// When 'spaceBetween' control is set as slider, the value is an object with 'size' and 'unit' keys
				if (
					swiperSettingsKey === "spaceBetween" &&
					typeof value === "object"
				) {
					value = value.size || defaultValue;
				}

				value =
					value ||
					dceGetParentValue(
						lastBreakpointValues[swiperSettingsKey],
					) ||
					defaultValue;
				value = value === "auto" ? value : Number(value);

				if (!lastBreakpointValues[swiperSettingsKey]) {
					lastBreakpointValues[swiperSettingsKey] = [];
				}
				lastBreakpointValues[swiperSettingsKey].push(value);

				// Ensure that `slidesPerGroup` is set to 1 if `slidesPerView` is 1 so that scrolling will not bypass any slides
				// This forcing is not passed into lastBreakpointValues
				if (
					swiperSettingsKey === "slidesPerGroup" &&
					breakpointSettings["slidesPerView"] === 1
				) {
					value = 1;
				}

				breakpointSettings[swiperSettingsKey] = value;
			}

			breakpoints[min_point] = breakpointSettings;
		});
	return breakpoints;
};

function dceGetParentValue(lastBreakpointValue) {
	const lastIndex = lastBreakpointValue
		? lastBreakpointValue.findLastIndex((el) => el !== 0)
		: -1;
	if (lastIndex !== -1) {
		return lastBreakpointValue[lastIndex];
	}
	return false;
}

window.initMap = () => {
	const event = new Event("dce-google-maps-api-loaded");
	window.dispatchEvent(event);
};
