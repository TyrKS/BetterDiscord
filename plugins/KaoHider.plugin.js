//META{"name":"KaoHider","authorId":"700701505627619348","invite":"Gsy7rse","source":"https://github.com/TyrKS","website":""}*//

class KaoHider {
	getName () {return "KaoHider";}

	getVersion () {return "1.0.1";}

	getAuthor () {return "Týr";}

	getDescription () {return "Hide discord servers.";}

	constructor () {
		this.changelog = {
		"fixed":[["KurhSecurity is publishing a lot of plugins for BetterDiscord!"]]
		};

		this.patchedModules = {
		after: {
			Guilds: "render"
		}
		};
	}

	getSettingsPanel () {
		if (!window.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
		let settingsPanel, settingsItems = [];
		
		settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
		type: "Button",
		className: BDFDB.disCN.marginbottom8,
		color: BDFDB.LibraryComponents.Button.Colors.RED,
		label: "Show all the servers & folders that are hidden.",
		onClick: _ => {
			BDFDB.ModalUtils.confirm(this, "Are you sure about that?", _ => {
			BDFDB.DataUtils.save([], this, "hidden");
			BDFDB.ModuleUtils.forceAllUpdates(this);
			});
		},
		children: BDFDB.LanguageUtils.LanguageStrings.RESET
		}));
		
		return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
	}

	load () {}

	start () {
		if (!window.BDFDB) window.BDFDB = {myPlugins:{}};
		if (window.BDFDB && window.BDFDB.myPlugins && typeof window.BDFDB.myPlugins == "object") window.BDFDB.myPlugins[this.getName()] = this;
		let libraryScript = document.querySelector("head script#BDFDBLibraryScript");
		if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
		if (libraryScript) libraryScript.remove();
		libraryScript = document.createElement("script");
		libraryScript.setAttribute("id", "BDFDBLibraryScript");
		libraryScript.setAttribute("type", "text/javascript");
		libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
		libraryScript.setAttribute("date", performance.now());
		libraryScript.addEventListener("load", _ => {this.initialize();});
		document.head.appendChild(libraryScript);
		}
		else if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
		this.startTimeout = setTimeout(_ => {
		try {return this.initialize();}
		catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
		}, 30000);
	}

	initialize () {
		if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
		if (this.started) return;
		BDFDB.PluginUtils.init(this);
		
		BDFDB.ModuleUtils.patch(this, BDFDB.LibraryModules.FolderStore, "getGuildFolderById", {after: e => {
			let hiddenGuildIds = BDFDB.DataUtils.load(this, "hidden", "servers") || [];
			if (e.returnValue && hiddenGuildIds.length) {
			let folder = Object.assign({}, e.returnValue);
			folder.guildIds = [].concat(folder.guildIds).filter(n => !hiddenGuildIds.includes(n));
			folder.hiddenGuildIds = [].concat(folder.guildIds).filter(n => hiddenGuildIds.includes(n));
			return folder;
			}
		}});

		BDFDB.ModuleUtils.forceAllUpdates(this);
		}
		else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
	}

	stop () {
		if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
		this.stopping = true;

		BDFDB.ModuleUtils.forceAllUpdates(this);

		BDFDB.PluginUtils.clear(this);
		}
	}

	onGuildContextMenu (e) {
		if (document.querySelector(BDFDB.dotCN.modalwrapper)) return;
		if (e.instance.props.target && e.instance.props.type.startsWith("GUILD_ICON_")) {
		let [children, index] = BDFDB.ReactUtils.findChildren(e.returnvalue, {name:["FluxContainer(MessageDeveloperModeGroup)", "DeveloperModeGroup"]});
		children.splice(index > -1 ? index : children.length, 0, BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Group, {
			children: [
			BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Sub, {
				label: this.labels.context_serverhider_text,
				render: [BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Group, {
				children: [
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Item, {
					label: this.labels.submenu_openhidemenu_text,
					action: _ => {
						BDFDB.ContextMenuUtils.close(e.instance);
						this.showHideModal();
					}
					}),
					!e.instance.props.guild && !e.instance.props.folderId ? null : BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItems.Item, {
					label: e.instance.props.guild ? this.labels.submenu_hideserver_text : this.labels.submenu_hidefolder_text,
					action: _ => {
						BDFDB.ContextMenuUtils.close(e.instance);
						if (e.instance.props.guild) this.toggleItem(BDFDB.DataUtils.load(this, "hidden", "servers") || [], e.instance.props.guild.id, "servers");
						else this.toggleItem(BDFDB.DataUtils.load(this, "hidden", "folders") || [], e.instance.props.folderId, "folders");
					}
					})
				].filter(n => n)
				})]
			})
			]
		}));
		}
	}

	processGuilds (e) {
		let hiddenGuildIds = BDFDB.DataUtils.load(this, "hidden", "servers") || [];
		let hiddenFolderIds = BDFDB.DataUtils.load(this, "hidden", "folders") || [];
		if (hiddenGuildIds.length || hiddenFolderIds.length) {
		let [children, index] = BDFDB.ReactUtils.findChildren(e.returnvalue, {props:["folderId", "guildId"], someProps:true});
		if (index > -1) for (let i in children) {
			let child = children[i];
			if (child.props.folderId) {
			if (hiddenFolderIds.includes(child.props.folderId))	children[i] = null;
			else {
				let guildIds = [].concat(child.props.guildIds.filter(guildId => !hiddenGuildIds.includes(guildId)));
				if (guildIds.length) {
				child.props.hiddenGuildIds = [].concat(child.props.guildIds.filter(guildId => hiddenGuildIds.includes(guildId)));
				child.props.guildIds = guildIds;
				}
				else children[i] = null;
			}
			}
			else if (child.props.guildId && hiddenGuildIds.includes(child.props.guildId)) children[i] = null;
		}
		}
	}

	showHideModal () {
		let hiddenGuildIds = BDFDB.DataUtils.load(this, "hidden", "servers") || [];
		let hiddenFolderIds = BDFDB.DataUtils.load(this, "hidden", "folders") || [];
		let guilds = BDFDB.LibraryModules.FolderStore.guildFolders.map(n => n.guildIds).flat(10).map(guildId => BDFDB.LibraryModules.GuildStore.getGuild(guildId)).filter(n => n);
		let folders = BDFDB.LibraryModules.FolderStore.guildFolders.filter(n => n.folderId);
		let foldersAdded = [];
		
		BDFDB.ModalUtils.open(this, {
		size: "MEDIUM",
		header: this.labels.modal_header_text,
		subheader: "",
		contentClassName: BDFDB.disCN.listscroller,
		children: guilds.map((guild, i) => {
			let folder = folders.find(folder => folder.guildIds.includes(guild.id) && !foldersAdded.includes(folder.folderId));
			if (folder) foldersAdded.push(folder.folderId);
			return [
			folder ? [
				folders.indexOf(folder) == 0 ? null : [
				BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
					className: BDFDB.disCNS.margintop4 + BDFDB.disCN.marginbottom4
				}),
				BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
					className: BDFDB.disCNS.margintop8 + BDFDB.disCN.marginbottom4
				})
				],
				BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ListRow, {
				prefix: BDFDB.ReactUtils.createElement("div", {
					className: BDFDB.disCN.listavatar,
					children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.GuildComponents.BlobMask, {
					children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Clickable, {
						className: BDFDB.disCN.guildfolder,
						children: BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.guildfoldericonwrapper,
						children: BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.guildfoldericonwrapperexpanded,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
							name: BDFDB.LibraryComponents.SvgIcon.Names.FOLDER,
							color: BDFDB.ColorUtils.convert(folder.folderColor, "RGB") || BDFDB.DiscordConstants.Colors.BRAND
							})
						})
						})
					})
					})
				}),
				label: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextScroller, {
					children: folder.folderName || `${BDFDB.LanguageUtils.LanguageStrings.SERVER_FOLDER_PLACEHOLDER} #${folders.indexOf(folder) + 1}`
				}),
				suffix: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Switch, {
					value: !hiddenFolderIds.includes(folder.folderId),
					onChange: value => {this.toggleItem(hiddenFolderIds, folder.folderId, "folders", value);}
				})
				})
			] : null,
			i == 0 && !folder ? null : BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
				className: BDFDB.disCNS.margintop4 + BDFDB.disCN.marginbottom4
			}),
			BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ListRow, {
				prefix: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.GuildComponents.Guild, {
				className: BDFDB.disCN.listavatar,
				guild: guild,
				menu: false,
				tooltip: false
				}),
				label: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextScroller, {
				children: guild.name
				}),
				suffix: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Switch, {
				value: !hiddenGuildIds.includes(guild.id),
				onChange: value => {this.toggleItem(hiddenGuildIds, guild.id, "servers", value);}
				})
			})
			];
		}).flat(10).filter(n => n),
		buttons: [{
			contents: BDFDB.LanguageUtils.LanguageStrings.OKAY,
			color: "BRAND",
			close: true
		}, {
			contents: BDFDB.LanguageUtils.LanguageStrings.FORM_LABEL_ALL,
			color: "TRANSPARENT",
			look: "LINK",
			click: (modal, instance) => {
			let enabled = hiddenGuildIds.includes(guilds[0].id);
			hiddenGuildIds = [].concat(enabled ? [] : guilds.map(n => n.id));
			BDFDB.DataUtils.save(hiddenGuildIds, this, "hidden", "servers");
			hiddenFolderIds = [].concat(enabled ? [] : folders.map(n => n.folderId));
			BDFDB.DataUtils.save(hiddenFolderIds, this, "hidden", "folders");
			let switchInstances = BDFDB.ReactUtils.findOwner(instance, {name:"BDFDB_Switch", all:true, unlimited:true});
			for (let switchIns of switchInstances) switchIns.props.value = enabled;
			BDFDB.ReactUtils.forceUpdate(switchInstances);
			BDFDB.ModuleUtils.forceAllUpdates(this);
			}
		}]
		});
	}

	toggleItem (array, id, type, force) {
		if (!id) return;
		if (force || (force === undefined && array.includes(id))) BDFDB.ArrayUtils.remove(array, id, true);
		else array.push(id);
		BDFDB.DataUtils.save(array, this, "hidden", type);
		BDFDB.ModuleUtils.forceAllUpdates(this);
	}
	setLabelsByLanguage () {
		switch (BDFDB.LanguageUtils.getLanguage().id) {
		case "es":	//spanish
			return {
			modal_header_text:		"Lista de Servidores || Panel de Admin.",
			context_serverhider_text:	"Visibilidad del servidor.",
			submenu_hideserver_text:	"Ocultar servidor.",
			submenu_hidefolder_text:	"Ocultar carpeta.",
			submenu_openhidemenu_text:	"Administrar lista de servidores."
			};
		default:	//default: english
			return {
			modal_header_text:		"Server List || Admin Panel.",
			context_serverhider_text:	"Visibility Options.",
			submenu_hideserver_text:	"Hide Server.",
			submenu_hidefolder_text:	"Hide Folder.",
			submenu_openhidemenu_text:	"Go to the admin panel."
			};
		}
	}
}
