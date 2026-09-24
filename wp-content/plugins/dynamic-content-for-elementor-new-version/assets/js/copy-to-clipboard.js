(function ($) {
	var WidgetElements_CopyToClipboardHandler = function ($scope, $) {
		var elementSettings = dceGetElementSettings($scope);
		var $button = $scope.find(".elementor-button");
		var clipboard = new ClipboardJS($button[0]);

		if (
			elementSettings.dce_clipboard_type === "code" &&
			elementSettings.dce_clipboard_visible &&
			typeof Prism !== "undefined"
		) {
			Prism.highlightAllUnder($scope[0]);
		}

		clipboard.on("success", function (e) {
			switch (elementSettings.animation_on_copy) {
				case "shake-animation":
					$button.addClass("animated").addClass("shake");
					setTimeout(function () {
						$button.removeClass("animated").removeClass("shake");
					}, 1000);
					break;

				case "change-text":
					var originalText = $button
						.find(".elementor-button-text")
						.html();
					$button
						.find(".elementor-button-text")
						.html(elementSettings.change_text);
					setTimeout(function () {
						$button
							.find(".elementor-button-text")
							.html(originalText);
					}, 1000);
					break;
			}
			return false;
		});

		clipboard.on("error", function (e) {
			console.error("Clipboard error:", e);
		});
	};

	// Register widget handler
	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/dce-copy-to-clipboard.default",
			WidgetElements_CopyToClipboardHandler,
		);
	});
})(jQuery);
