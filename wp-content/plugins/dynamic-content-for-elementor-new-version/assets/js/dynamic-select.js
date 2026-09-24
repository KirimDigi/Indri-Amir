"use strict";
(() => {
	const tagsToReplace = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
	};

	const replaceTag = (tag) => {
		return tagsToReplace[tag] || tag;
	};

	// Remove tags from string for security.
	const safe_tags_replace = (str) => {
		return str.replace(/[&<>]/g, replaceTag);
	};

	const getFieldValue = (form, id) => {
		let data = new FormData(form);
		let key = `form_fields[${id}]`;
		if (data.has(key)) {
			return data.get(key);
		}
		key = `form_fields[${id}][]`;
		if (data.has(key)) {
			return data.getAll(key);
		}
		return "";
	};

	const initializeDynamicSelectField = (field, formWrapper) => {
		const form = formWrapper.getElementsByTagName("form")[0];
		const selectTag = field.getElementsByTagName("select")[0];
		const options = JSON.parse(selectTag.getAttribute("data-options"));
		const fieldId = selectTag.getAttribute("data-field-id");
		const targets = formWrapper.querySelectorAll(
			`[name='form_fields[${fieldId}]']`,
		);
		if (targets.length != 0) {
			const updateField = () => {
				selectTag.innerHTML = "";
				const tval = getFieldValue(form, fieldId);
				const coptions = options[tval];
				if (!coptions) {
					// no options for this value.
				} else {
					for (const opt of coptions) {
						let value = opt;
						let text = opt;
						if (opt.search(/\|/) !== -1) {
							[text, value] = opt.split("|");
						}
						let el = document.createElement("option");
						el.text = safe_tags_replace(text);
						el.value = value;
						selectTag.add(el);
					}
				}
				// needed for recursive dynamic select, trigger the event onchange:
				if ("createEvent" in document) {
					var evt = document.createEvent("HTMLEvents");
					evt.initEvent("change", false, true);
					selectTag.dispatchEvent(evt);
				} else {
					selectTag.fireEvent("onchange");
				}
			};
			updateField();
			targets.forEach((input) => {
				input.addEventListener("change", updateField);
			});
		} else {
			selectTag.innerHTML =
				"<option>Could not find reference field.</option>";
		}
	};

	const initializeDynamicSelectFields = ($form) => {
		$form
			.find(".elementor-field-type-dynamic_select")
			.each((_, f) => initializeDynamicSelectField(f, $form[0]));
	};

	jQuery(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/form.default",
			initializeDynamicSelectFields,
		);
	});
})();
