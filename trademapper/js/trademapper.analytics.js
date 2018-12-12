/**
 * Analytics
 *
 * This sets up Google analytics, and handles GDPR cookie warning
 */
define([
	"jquery", "jscookie", "config", "text!../fragments/cookiedialog.html"
], function($, cookies, config, cookieDialogHtml) {
	"use strict";

	return {

	init: function() {
		if (config.trackingId && cookies.get('cookiepref') === 'all') {
			this.startAnalytics();
		}
		if (cookies.get('cookiepref') === undefined) {
			this.setupCookieDialog();
		}
	},

	startAnalytics: function() {
		var url = "https://www.googletagmanager.com/gtag/js?id=" + config.trackingId;
		$.getScript(url, function() {
			window.dataLayer = window.dataLayer || [];
			function gtag() {
				dataLayer.push(arguments);
			}
			gtag('js', new Date());
			gtag('config', config.trackingId);
		});
	},

	setupCookieDialog: function() {
		var $dialog = $(cookieDialogHtml);

		// Approve cookies
		$('.cookie-banner-ok', $dialog).click(function() {
			$dialog.fadeOut();
			cookies.set('cookiepref', 'all', { expires: 365 });
			this.startAnalytics();
		}.bind(this));

		// Hide bits about analytics if not configured
		if (!config.trackingId) {
			$('.cookiedialog-analytics', $dialog).hide();
		}

		$dialog.appendTo('body').fadeIn('slow');
	}

	}
});
