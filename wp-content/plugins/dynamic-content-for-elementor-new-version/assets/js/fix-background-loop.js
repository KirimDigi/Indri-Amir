dce = {
	applyDynamicStyles: function (element) {
		var $el = jQuery(element);
		
		// Apply all color data attributes
		var colorAttrs = [
			"dce-text-color",
			"dce-title-color",
			"dce-background-color",
			"dce-background-hover-color",
			"dce-background-overlay-color",
			"dce-background-overlay-hover-color",
			"dce-advanced-background-color",
			"dce-advanced-background-hover-color",
			"dce-advanced-background-overlay-color",
			"dce-advanced-background-overlay-hover-color",
		];
		
		colorAttrs.forEach(function (attr) {
			var value = $el.data(attr);
			if (value) {
				if (attr === "dce-title-color") {
					dce.addCssForTitleColor(element, value);
				} else if (attr === "dce-text-color") {
					dce.addCssForTextColor(element, value);
				} else {
					dce.addCssForBackgroundColor(element, value);
				}
			}
		});

		// Apply all background image data attributes
		var imageAttrs = [
			"dce-background-image-url",
			"dce-background-hover-image-url",
			"dce-background-overlay-image-url",
			"dce-background-overlay-hover-image-url",
			"dce-advanced-background-image-url",
			"dce-advanced-background-hover-image-url",
			"dce-advanced-background-overlay-image-url",
			"dce-advanced-background-overlay-hover-image-url",
		];
		
		imageAttrs.forEach(function (attr) {
			var value = $el.data(attr);
			if (value) {
				dce.addCssForBackgroundImage(element, value);
			}
		});
	},
	getTargetElement: function (element, forBackground) {
		var $element = jQuery(element);
		
		// Section
		if ($element.hasClass("elementor-section")) {
			return $element;
		}
		
		// Column
		if ($element.hasClass("elementor-column")) {
			var $columnWrap = $element.find(".elementor-column-wrap").first();
			if ($columnWrap.length) {
				return $columnWrap;
			}
			return $element.find(".elementor-widget-wrap").first();
		}
		
		// Flex Container
		if ($element.hasClass("e-container") || $element.hasClass("e-con")) {
			return $element;
		}
		
		// Widget - support both old and new Elementor structure (3.27+)
		if ($element.hasClass("elementor-widget") || $element.hasClass("elementor-widget-container")) {
			if (forBackground) {
				var $container = $element.find(".elementor-widget-container").first();
				return $container.length ? $container : $element;
			}
			return $element;
		}
		
		return $element;
	},
	addCssForBackgroundImage: function (element, value) {
		if (value) {
			var $target = this.getTargetElement(element, true);
			$target.css("background-image", "url(" + value + ")");
		}
	},
	addCssForBackgroundColor: function (element, value) {
		if (value) {
			var $target = this.getTargetElement(element, true);
			$target.css("background-color", value);
		}
	},
	addCssForTextColor: function (element, value) {
		if (value) {
			var $target = this.getTargetElement(element, true);
			$target.css("color", value);
		}
	},
	addCssForTitleColor: function (element, value) {
		if (value) {
			// Apply to heading title inside the element
			jQuery(element).find(".elementor-heading-title").css("color", value);
		}
	},
};
