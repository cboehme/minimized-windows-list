/*
	Minimized Windows List (Version 1)
	
	A Gnome-Shell extension which adds an icon to the 
	top panel showing a list of minimized windows
		
	http://github.com/Xoff/minimized-windows-list
	
	(C) 2013 Christoph Böhme <christoph@b3e.net>
	
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>
*/

const Lang = imports.lang;

const St = imports.gi.St;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;


function MinWinListExtension() {
	this._init();
}

MinWinListExtension.prototype = {

	_init: function() {
		this._indicator = null;
	},
	
	enable: function() {
		if (this._indicator === null) {
			this._indicator = new MinWinListIndicator();
			Main.panel.addToStatusArea("minimized-window-list", this._indicator);
		}
	},
	
	disable: function() {
		if (this._indicator !== null) {
			this._indicator.destroy();
			this._indicator = null;
		}
	}	

}


const MinWinListMenuItem = new Lang.Class({

	Name: 'MinWinListMenuItem',
	Extends: PopupMenu.PopupBaseMenuItem,
	
	_init: function(icon, text, window) {
		this.parent();
		
		this._window = window;
		
		let box = new St.BoxLayout({ style_class: 'popup-combobox-item' });		
		box.add(icon);
		box.add(new St.Label({ text: text }));
		this.addActor(box);
		
		this.connect('activate', Lang.bind(this, this._restoreWindow));
	},
	
	_restoreWindow: function() {
		let time = global.get_current_time();
		this._window.get_workspace().activate(time);
		this._window.activate(time);
	}
	
});


const MinWinListIndicator = new Lang.Class({

	Name: 'MinWinListIndicator',
	Extends: PanelMenu.SystemStatusButton,

	_init: function() {
		this.parent('view-list-symbolic', _("Minimized Windows List"));
		
		this._restackedId = global.screen.connect('restacked', 
				Lang.bind(this, this._updateWindowList));
		this._updateWindowList();
	},
	
	onDestory: function() {
		global.screen.disconnect(this._restackedId);
	},
		
	_updateWindowList: function() {
		this.menu.removeAll();
		
		// First, add minimised windows on 
		// the current workspace:
		this._addWorkspaceWindows(global.screen.get_active_workspace());
		
		// Then add a menu item separator:
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		
		// And finally add all minimised windows on 
		// the remaining workspaces:
		for (let i = 0; i < global.screen.get_n_workspaces(); ++i) {
			let workspace = global.screen.get_workspace_by_index(i);
			if (workspace !== global.screen.get_active_workspace()) {
				this._addWorkspaceWindows(workspace);				
			}
		}
		
		// Only show the status area icon if there is 
		// at least one minimised window:
		if (this.menu.numMenuItems === 1) {
			this.actor.hide();
		} else {
			this.actor.show();
		}
	},
	
	_addWorkspaceWindows: function(workspace) {
		// Appends all minimised windows on `workspace` to the menu		
		let tracker = Shell.WindowTracker.get_default();
		let windows = workspace.list_windows();
		
		for (let i = 0; i < windows.length; ++i) {
			if (!windows[i].showing_on_its_workspace()) {
				let appWin = tracker.get_window_app(windows[i]);
				let appIcon = appWin.create_icon_texture(22);
				let appName = appWin.get_name();
				let title = windows[i].get_title();
				
				let menuItem = new MinWinListMenuItem(appIcon, 
						appName + " (" + title + ")", windows[i]);
				this.menu.addMenuItem(menuItem);
			}
		}
	}

});


function init() {    
	return new MinWinListExtension();
}
