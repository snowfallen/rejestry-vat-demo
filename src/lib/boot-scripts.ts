// Scripts inlined in the document head: they run before the first paint, outside React.
// A plain module (not 'use client'), so the server layout receives the strings themselves.

import { headerColor } from './theme-colors';

export const themeStorageKey = 'onsaldo-theme';

/**
 * A stored or system dark theme never flashes light; the browser bar follows the theme
 * chosen in the app, not only the system's (its meta tags exist once the head is parsed).
 */
const themeScript = `try{var t=localStorage.getItem('${themeStorageKey}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',t==='dark'?'${headerColor.dark}':'${headerColor.light}')})})}catch(e){}`;

/**
 * The first visit in a session gets the entrance (`html[data-intro]`, see globals.css);
 * the register screen removes the flag once it has played.
 */
const introScript = `try{if(!sessionStorage.getItem('rv-intro')){sessionStorage.setItem('rv-intro','1');document.documentElement.dataset.intro=''}}catch(e){}`;

export const bootScript = themeScript + introScript;
