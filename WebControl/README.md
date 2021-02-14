# Unreal Web App

#### Launching a remote control server. 
_Should be launched by default in the template project._
1. Enable the remote control plugin in Unreal Engine.
2. In the console, enter the command `WebControl.StartServer`


To launch the server on startup, you need to add this to your `DefaultEngine.ini` file.
```
[SystemSettings]
WebControl.EnableServerOnStartup=1
```

#### Configuring the app
Map related configuration is stored in userConfig.json
Default settings for the app are in defaultConfig.json

#### Running the web app locally with hot reload
1. `npm install`
2. `npm run serve`

If you need to have the server run on a secondary or tertiary network adapter you can instead run:
`npm run serve -- --public <ip of localhost on secondary adapter>:<port>`

**The two sets of `--` are important**
_You can discover the IP address of your local machine on each network adapter by running `ipconfig`_

#### Running a production build
1. `npm run build`
2. Install a static file server: `npm install -g serve`
3. Start the file server in single page app mode: `serve -s dist` 

If you need to run the server on a secondary or tertiary network adapter you can instead run:
2. `serve -s dist --listen tcp://<ip>:<port>`

### Using the web app in other maps
If you want to experience all the features of the web app, you should first add the following blueprint actors to your level: ( Located in _/Game/Blueprints/SceneAdjustments )_
- BP_EventManager
- BP_LightCardManager
- ActorInfo Structure
- BP_RemoteControlUtilities

Then change the map-specific settings in the `userConfig.json` file.


