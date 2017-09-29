/* global Inputmask */
import { once, debounce } from '@ember/runloop';
import { computed, observer } from '@ember/object';
import PaperInput from 'ember-paper/components/paper-input';
import layout from 'ember-paper/templates/components/paper-input';

export default PaperInput.extend({
	layout,

	mask: '',
	debounce: 0,

	type: 'text',
	pattern: null,
	value: 'value',

	rightAlign: false,
	greedyMask: false,

	showMaskOnFocus: true,
	showMaskOnHover: true,
	clearIncomplete: false,

	options: computed(function() {
		return {};
	}),

	// Initialize the mask by forcing a
	// call to the updateMask function
	didInsertElement: function() {
		if (this.isDestroyed) { return; }

		this._super(...arguments);

		let field = this.$('input').get(0);

		this.set('field', field);

		this.propertyDidChange('mask');
	},

	// Remove the mask from the input
	willDestroyElement() {
		if (this.isDestroyed) { return; }

		this._super(...arguments);

		let element = this.get('field');

		element && element.inputmask.remove();
	},

	setMask() {
		Inputmask.extendDefinitions({
			'2': { 'validator': '[2-9]' }
		});

		let element = this.get('field');
		if (!element) { return; }

		let mask = this.get('mask');
		let options = this.get('options');

		element.inputmask && element.inputmask.remove();

		let inputmask = new Inputmask(mask, options);
		inputmask.mask(element);

		// Initialize the unmasked value if it exists
		let value = this.get('unmaskedValue');
		value && (element.value = value);

		// If the mask has changed, we need to refocus the input to show the
		// proper mask preview. Since the caret is not positioned by the focus
		// even, but the click event, we need to trigger a click as well.
		if (element === document.activeElement) {
			element.blur(); element.focus(); element.click();
		}
	},

	// Update the mask whenever the mask itself changes or one of the options changes.
	// This observer is meant to be extensible so that other fields can add options
	// (See `decimal-input`), which is why the actual setting of the mask is handled
	// in another function.
	updateMask() {
		this.get('mask').toLowerCase() === 'regex'
			&& this.set('options.mask', '')
			|| this.set('options.regex', this.get('pattern') || this.get('regex'));

		this.setProperties({
			'options.greedy': this.get('greedyMask'),
			'options.rightAlign': this.get('rightAlign'),
			'options.placeholder': this.get('maskPlaceholder'),
			'options.showMaskOnFocus': this.get('showMaskOnFocus'),
			'options.showMaskOnHover': this.get('showMaskOnHover'),
			'options.clearIncomplete': this.get('clearIncomplete')
		});

		this.setMask();
	},

	updateVar() {
		let element = this.get('field');

		element && element.inputmask
			&& this.get('unmaskedValue')
				!== element.inputmask.unmaskedvalue()
			&& (element.value = this.get('unmaskedValue'));
	},

	_maskShouldChange: observer(
		'mask',
		'regex',
		'pattern',
		'greedyMask',
		'rightAlign',
		'maskPlaceholder',
		'showMaskOnFocus',
		'showMaskOnHover',
		'clearIncomplete',
		function() {
			once(this, 'updateMask');
		}
	),

	// Unmask the value of the field and set the property.
	setUnmaskedValue: observer('value', function() {
		let element = this.get('field');
		element && element.inputmask
			&& this.set('unmaskedValue', element.inputmask.unmaskedvalue());
	}),

	// When the unmaskedValue changes, set the value.
	setValue: observer('unmaskedValue', function() {
		let debounceTime = this.get('debounce');
		!debounceTime
			? this.updateVar()
			: debounce(this, this.updateVar, debounceTime);
	})
});
