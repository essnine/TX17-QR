/**
 * Original:
 *   http://mxr.mozilla.org/mozilla-central/source/toolkit/mozapps/extensions/nsBlocklistService.js?raw=1
 * Usage:
 *   1. Go to "about:config" and turn "devtools.chrome.enabled" to "true".
 *   2. Start "Scratchpad" with Shift-F4.
 *   3. Change the context from "web page" to "browser".
 *   4. Copy this script and paste to the scratchpad.
 *   5. Run it.
 * Sample result:
 *   on Windows XP, Firefox 17.0.4ESR:
 *     https://addons.mozilla.org/blocklist/3/%7Bec8030f7-c20a-464f-9b0e-13a3a9e97384%7D/17.0.4/Firefox/20130307074601/WINNT_x86-msvc/ja/esr/Windows_NT%205.1/default/default/invalid/invalid/0/
 */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const TOOLKIT_ID                      = "toolkit@mozilla.org"
const KEY_PROFILEDIR                  = "ProfD";
const KEY_APPDIR                      = "XCurProcD";
const FILE_BLOCKLIST                  = "blocklist.xml";
const PREF_BLOCKLIST_LASTUPDATETIME   = "app.update.lastUpdateTime.blocklist-background-update-timer";
const PREF_BLOCKLIST_URL              = "extensions.blocklist.url";
const PREF_BLOCKLIST_ITEM_URL         = "extensions.blocklist.itemURL";
const PREF_BLOCKLIST_ENABLED          = "extensions.blocklist.enabled";
const PREF_BLOCKLIST_INTERVAL         = "extensions.blocklist.interval";
const PREF_BLOCKLIST_LEVEL            = "extensions.blocklist.level";
const PREF_BLOCKLIST_PINGCOUNTTOTAL   = "extensions.blocklist.pingCountTotal";
const PREF_BLOCKLIST_PINGCOUNTVERSION = "extensions.blocklist.pingCountVersion";
const PREF_PLUGINS_NOTIFYUSER         = "plugins.update.notifyUser";
const PREF_GENERAL_USERAGENT_LOCALE   = "general.useragent.locale";
const PREF_APP_DISTRIBUTION           = "distribution.id";
const PREF_APP_DISTRIBUTION_VERSION   = "distribution.version";
const PREF_EM_LOGGING_ENABLED         = "extensions.logging.enabled";
const XMLURI_BLOCKLIST                = "http://www.mozilla.org/2006/addons-blocklist";
const XMLURI_PARSE_ERROR              = "http://www.mozilla.org/newlayout/xml/parsererror.xml"
const UNKNOWN_XPCOM_ABI               = "unknownABI";
const URI_BLOCKLIST_DIALOG            = "chrome://mozapps/content/extensions/blocklist.xul"
const DEFAULT_SEVERITY                = 3;
const DEFAULT_LEVEL                   = 2;
const MAX_BLOCK_LEVEL                 = 3;
const SEVERITY_OUTDATED               = 0;
const VULNERABILITYSTATUS_NONE             = 0;
const VULNERABILITYSTATUS_UPDATE_AVAILABLE = 1;
const VULNERABILITYSTATUS_NO_UPDATE        = 2;

var gBlocklistLevel = DEFAULT_LEVEL;

var gPref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).
         QueryInterface(Ci.nsIPrefBranch);
var gApp = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).
         QueryInterface(Ci.nsIXULRuntime);
var gABI = (function bls_gABI() {
  let abi = null;
  try {
    abi = gApp.XPCOMABI;
  }
  catch (e) {
    alert("BlockList Global gABI: XPCOM ABI unknown.");
  }
  return abi;
})();

var gOSVersion = (function bls_gOSVersion() {
  let osVersion;
  let sysInfo = Cc["@mozilla.org/system-info;1"].
                getService(Ci.nsIPropertyBag2);
  try {
    osVersion = sysInfo.getProperty("name") + " " + sysInfo.getProperty("version");
  }
  catch (e) {
    alert("BlockList Global gOSVersion: OS Version unknown.");
  }

  if (osVersion) {
    try {
      osVersion += " (" + sysInfo.getProperty("secondaryLibrary") + ")";
    }
    catch (e) {
      // Not all platforms have a secondary widget library, so an error is nothing to worry about.
    }
    osVersion = encodeURIComponent(osVersion);
  }
  return osVersion;
})();


/**
 * Gets a preference value, handling the case where there is no default.
 * @param   func
 *          The name of the preference function to call, on nsIPrefBranch
 * @param   preference
 *          The name of the preference
 * @param   defaultValue
 *          The default value to return in the event the preference has
 *          no setting
 * @returns The value of the preference, or undefined if there was no
 *          user or default value.
 */
function getPref(func, preference, defaultValue) {
  try {
    return gPref[func](preference);
  }
  catch (e) {
  alert(preference+' / '+e);
  }
  return defaultValue;
}

/**
 * Constructs a URI to a spec.
 * @param   spec
 *          The spec to construct a URI to
 * @returns The nsIURI constructed.
 */
function newURI(spec) {
  var ioServ = Cc["@mozilla.org/network/io-service;1"].
               getService(Ci.nsIIOService);
  return ioServ.newURI(spec, null, null);
}

/**
 * Gets the current value of the locale.  It's possible for this preference to
 * be localized, so we have to do a little extra work here.  Similar code
 * exists in nsHttpHandler.cpp when building the UA string.
 */
function getLocale() {
  try {
      // Get the default branch
      var defaultPrefs = gPref.getDefaultBranch(null);
      return defaultPrefs.getComplexValue(PREF_GENERAL_USERAGENT_LOCALE,
                                          Ci.nsIPrefLocalizedString).data;
  } catch (e) {}

  return gPref.getCharPref(PREF_GENERAL_USERAGENT_LOCALE);
}

/* Get the distribution pref values, from defaults only */
function getDistributionPrefValue(aPrefName) {
  var prefValue = "default";

  var defaults = gPref.getDefaultBranch(null);
  try {
    prefValue = defaults.getCharPref(aPrefName);
  } catch (e) {
    // use default when pref not found
  }

  return prefValue;
}

function getUpdateChannel() {
  var channel = "default";
  var prefName;
  var prefValue;

  var defaults = Services.prefs.getDefaultBranch(null);
  try {
    channel = defaults.getCharPref("app.update.channel");
  } catch (e) {
    // use default when pref not found
  }

  try {
    var partners = Services.prefs.getChildList("app.partner.");
    if (partners.length) {
      channel += "-cck";
      partners.sort();

      for each (prefName in partners) {
        prefValue = Services.prefs.getCharPref(prefName);
        channel += "-" + prefValue;
      }
    }
  }
  catch (e) {
    Cu.reportError(e);
  }

  return channel;
}

  gBlocklistLevel = Math.min(getPref("getIntPref", PREF_BLOCKLIST_LEVEL, DEFAULT_LEVEL),
                                     MAX_BLOCK_LEVEL);
  function getBlocklistURI() {
   try {
      var dsURI = gPref.getCharPref(PREF_BLOCKLIST_URL);
    }
    catch (e) {
      alert("Blocklist::notify: The " + PREF_BLOCKLIST_URL + " preference" +
          " is missing!");
      return;
    }

    var pingCountVersion = getPref("getIntPref", PREF_BLOCKLIST_PINGCOUNTVERSION, 0);
    var pingCountTotal = getPref("getIntPref", PREF_BLOCKLIST_PINGCOUNTTOTAL, 1);
    var daysSinceLastPing = 0;
    if (pingCountVersion == 0) {
      daysSinceLastPing = "new";
    }
    else {
      // Seconds in one day is used because nsIUpdateTimerManager stores the
      // last update time in seconds.
      let secondsInDay = 60 * 60 * 24;
      let lastUpdateTime = getPref("getIntPref", PREF_BLOCKLIST_LASTUPDATETIME, 0);
      if (lastUpdateTime == 0) {
        daysSinceLastPing = "invalid";
      }
      else {
        let now = Math.round(Date.now() / 1000);
        daysSinceLastPing = Math.floor((now - lastUpdateTime) / secondsInDay);
      }

      if (daysSinceLastPing == 0 || daysSinceLastPing == "invalid") {
        pingCountVersion = pingCountTotal = "invalid";
      }
    }

    if (pingCountVersion < 1)
      pingCountVersion = 1;
    if (pingCountTotal < 1)
      pingCountTotal = 1;

    dsURI = dsURI.replace(/%APP_ID%/g, gApp.ID);
    dsURI = dsURI.replace(/%APP_VERSION%/g, gApp.version);
    dsURI = dsURI.replace(/%PRODUCT%/g, gApp.name);
    dsURI = dsURI.replace(/%VERSION%/g, gApp.version);
    dsURI = dsURI.replace(/%BUILD_ID%/g, gApp.appBuildID);
    dsURI = dsURI.replace(/%BUILD_TARGET%/g, gApp.OS + "_" + gABI);
    dsURI = dsURI.replace(/%OS_VERSION%/g, gOSVersion);
    dsURI = dsURI.replace(/%LOCALE%/g, getLocale());
    dsURI = dsURI.replace(/%CHANNEL%/g, getUpdateChannel);
    dsURI = dsURI.replace(/%PLATFORM_VERSION%/g, gApp.platformVersion);
    dsURI = dsURI.replace(/%DISTRIBUTION%/g,
                      getDistributionPrefValue(PREF_APP_DISTRIBUTION));
    dsURI = dsURI.replace(/%DISTRIBUTION_VERSION%/g,
                      getDistributionPrefValue(PREF_APP_DISTRIBUTION_VERSION));
    dsURI = dsURI.replace(/%PING_COUNT%/g, pingCountVersion);
    dsURI = dsURI.replace(/%TOTAL_PING_COUNT%/g, pingCountTotal);
    dsURI = dsURI.replace(/%DAYS_SINCE_LAST_PING%/g, daysSinceLastPing);
    dsURI = dsURI.replace(/\+/g, "%2B");

    // Under normal operations it will take around 5,883,516 years before the
    // preferences used to store pingCountVersion and pingCountTotal will rollover
    // so this code doesn't bother trying to do the "right thing" here.
    if (pingCountVersion != "invalid") {
      pingCountVersion++;
      if (pingCountVersion > 2147483647) {
        // Rollover to -1 if the value is greater than what is support by an
        // integer preference. The -1 indicates that the counter has been reset.
        pingCountVersion = -1;
      }
      gPref.setIntPref(PREF_BLOCKLIST_PINGCOUNTVERSION, pingCountVersion);
    }

    if (pingCountTotal != "invalid") {
      pingCountTotal++;
      if (pingCountTotal > 2147483647) {
        // Rollover to 1 if the value is greater than what is support by an
        // integer preference.
        pingCountTotal = -1;
      }
      gPref.setIntPref(PREF_BLOCKLIST_PINGCOUNTTOTAL, pingCountTotal);
    }

    // Verify that the URI is valid
    try {
      var uri = newURI(dsURI);
    }
    catch (e) {
      alert("Blocklist::notify: There was an error creating the blocklist URI\r\n" +
          "for: " + dsURI + ", error: " + e);
      return;
    }

    return uri.spec;
  }

alert(getBlocklistURI());
})();