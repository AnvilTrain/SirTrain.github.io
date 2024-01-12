var leafMap = {
	map: null,
	groupLayerController: null,
	infoControl: null,
	uiController: null,
	mapSettings: null,
	mapOptions: null,
	init: function(){
		console.log("Init leafMap");
		
		this.map = L.map('leafMap', {
			crs: L.CRS.Simple,
			maxZoom: -3,
			maxNativeZoom: -3,
			minZoom: -11,
			minNativeZoom: -11,
			preferCanvas: true,
			doubleClickZoom: false,
			attributionControl: false
		});
		
		//Load plugins and layer controls
		L.control.watermark({ position: 'bottomright', text: 'Map 1.4.5.0 | Game 62033 | By Cooltrain' }).addTo(this.map);
		
		this.groupLayerController = L.control.groupLayerController(
		{
			position: 'topright',
			panelOptions: {
				title: "Layers"
			}
		}).addTo(this.map);
		//L.control.mapOptions({position: 'topright', text: 'Coming Soon!' }).addTo(this.map);
		
		this.uiController = new UIInterfaceController(this.map);
		this.mapSettings = new MapSettings();
		
		//Check the info panel to see other default options
		this.infoControl = L.control.infoPanel({
			position: 'topleft',
			panelOptions: {
				title: "Info"
			},
			dragOptions:
			{
				isDragEnabled: true,
				shapeTypes: [L.Circle, L.Donut]
			},
			gridOptions: {
				isGridsEnabled: true,
				grids: [
					{
						name: "Grid",
						isEnabled : true,
						height: this.mapSettings.GridHeight,
						width: this.mapSettings.GridWidth,
						gridBounds: this.mapSettings.MapBounds,
						doGridMarkers: true,
						doPerCellMarkers: false,
						doShowInInfo: true,
						//lineCol: "black",
						//lineWeight: 2,
					},
					{
						name: "Region Grid",
						isEnabled : false,
						height: 3,
						width: 2,
						gridBounds: this.mapSettings.MapBounds,
						doGridMarkers: false,
						doPerCellMarkers: false,
						doShowInInfo: false,
						//lineCol: "black",
						//lineWeight: 2,
					}
				]
			}
		}).addTo(this.map);

		//Setup our draw control
		this.drawControl = L.control.drawPanel({
			position: 'topleft',
			useColoris: true,
			panelOptions: {
				title: "Draw"
			},
			drawOptions: {
				defaultColour: 'red'
			}
		}).addTo(this.map);
		
		//Subscribe to new draw layer events
		const self = this;
		document.addEventListener("DrawPanel:LayerUpdate",(event) => {
			const eventObj = event.detail;
			
			if(eventObj.updateType = "NewLayer")
			{
				self.uiController.addShapeToDrawLayer(eventObj.layers);
			}
		});
		document.addEventListener("DrawPanel:LayerClear",(event) => 
		{
			const eventObj = event.detail;
			self.uiController.clearDrawLayer();
		});
		
		//Bind the tools/shapes we want in the draw menu to the control
		this.drawControl.bindTools(this.getDrawTools());
		
		console.log("Found map settings " + this.mapSettings.MapHeight + " x " + this.mapSettings.MapWidth);
		this.loadAnvilSettings(this.mapSettings);
		this.processAnvilData(this.mapSettings.MapHeight, this.mapSettings.MapWidth);
		
		//Manual added river fording lines
		this.insertMapCrossingPaths();
		
	},
	/*Define the draw tools to be used by the draw panel*/
	getDrawTools: function()
	{
		const toolbox = {};
		toolbox.tools = [];
		
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "TownHall Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 12000, interactive: false }});
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "Pump No-Build Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 8000, interactive: false }});
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "Well No-Build Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 4000, interactive: false }});
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "Water Wheel No-Build Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 4000, interactive: false }});
		
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "Beacon Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 12000, interactive: false }});
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "T1 Town Beacon Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 12000, interactive: false }});
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "T2 Town Beacon Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 15000, interactive: false }});
		toolbox.tools.push({ type:L.circle, toolOptions:{ name: "T3 Town Beacon Radius", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 20000, interactive: false }});
		
		toolbox.tools.push({ type:L.polygon, toolOptions:{ name: "Polygon Tool", isStatic: false }, options: { color:'red', interactive: false }});
		toolbox.tools.push({ type:L.polyline, toolOptions:{ name: "Line Tool", isStatic: false }, options: { color:'red', interactive: false }});
		
		//This needs a symbol set but we current set it inside the init for the custom type
		toolbox.tools.push({ type:L.polylineDecorated, toolOptions:{ name: "Arrow Line", isStatic: false },
		options: {color:'red', interactive: false, decorationOptions:{ patterns: [{ offset: 25, repeat: 25, symbolObj:{type:L.Symbol.arrowHead, options:{ pixelSize: 15, pathOptions: { stroke: true, color: 'red', interactive: false} }} }] }}});
		
		toolbox.tools.push({ type:L.PolylineRuler, toolOptions:{ name: "Ruler", isStatic: false }, options: {color:'red', dashArray: '10, 10', interactive: false }});
		toolbox.tools.push({ type: L.positionMarker, toolOptions:{ name: "Position Pin", isStatic: true, allowTooltipOverride: false}, options: {draggable:true, interactive: true}});

		//toolbox.tools.push({ type:L.CompositeShape, toolOptions:{ name: "Beacon Composite", isStatic: true, hasMiddleDot: false }, options: { radius: 23000, color:'red', interactive: false, compositeOptions:{shapes:[{type:L.circle, options: {radius: 18500, color:'red', interactive: false }},{type:L.circle, options: {radius: 12000, color:'red', interactive: false }}]} }});
	
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Ancient T1", isStatic: true },
		iconOptions:{iconUrl: "./img/icons/IconAncientT1.png", size: 76},
		options: { interactive: false }});
		
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Ancient T2", isStatic: true },
		iconOptions:{iconUrl: "./img/icons/IconAncientT2.png", size: 76},
		options: { interactive: false }});
		
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Ancient T3", isStatic: true },
		iconOptions:{iconUrl: "./img/icons/IconAncientT3.png", size: 76},
		options: { interactive: false }});
		
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Remnant T1", isStatic: true },
		iconOptions:{iconUrl: "./img/icons/IconRemnantT1.png", size: 76},
		options: { interactive: false }});
		
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Remnant T2", isStatic: true },
		iconOptions:{iconUrl: "./img/icons/IconRemnantT2.png", size: 76},
		options: { interactive: false }});
		
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Remnant T3", isStatic: true },
		iconOptions:{iconUrl: "./img/icons/IconRemnantT3.png", size: 76},
		options: { interactive: false }});

		//Structure Icons
		toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Large Camp", isStatic: true }, iconOptions:{iconUrl: "./img/icons/IconCamp.png", size: 64}, options: { interactive: false }});

		//Foxhole region testing
		//toolbox.tools.push({ type:L.circle, toolOptions:{ name: "Foxhole Hex", isStatic: true, hasMiddleDot: true }, options: { color:'red', radius: 219700, interactive: false }});
		//toolbox.tools.push({ type:L.marker, toolOptions:{ name: "Remnant Hex Img", isStatic: true }, iconOptions:{iconUrl: "./img/FoxholeRegion.png", size: 218}, options: { interactive: false }});
		
		
		return toolbox;
	},
	loadAnvilSettings: function(mapSettings)
	{
		if(!this.map)
			return;
		
		//Base Calligo
		this.map.fitBounds(mapSettings.MapBounds);
		let mapBaseImg = L.imageOverlay(mapSettings.MapImage, mapSettings.MapBounds, {interactive:false}).addTo(this.map);
		let mapBaseOld = L.imageOverlay(mapSettings.MapImageOld, mapSettings.MapBounds, {interactive:false});
		
		this.groupLayerController.addBaseLayer(mapBaseImg, "Calligo", "Maps");
		this.groupLayerController.addBaseLayer(mapBaseOld, "Calligo Old", "Maps");

		//Game Tree Overlay
		const TreeOverlayBounds = L.latLngBounds([mapSettings.MapBounds.getNorth() - mapSettings.MapTreeOverlayYOffset, mapSettings.MapBounds.getWest()],[mapSettings.MapBounds.getSouth() - mapSettings.MapTreeOverlayYOffset, mapSettings.MapBounds.getEast()]);
		let mapTreeOverlayImg = L.imageOverlay(mapSettings.MapTreeImage, TreeOverlayBounds, {interactive:false}).addTo(this.map);
		this.groupLayerController.addOverlay(mapTreeOverlayImg, "Map Trees", "General");
		
		//Create our grid layer and add it to our layer controller
		if(this.infoControl)
		{
			let grids = this.infoControl.createGridLayers();
			if(grids)
			{
				for(let i = 0; i < grids.length; i++)
				{
					
					this.groupLayerController.addOverlay(grids[i].layer, grids[i].name, "General");
				}
			}
		}
	},
	processAnvilData: function(mapHeight, mapWidth)
	{
		console.log("Starting map data processing");
	
		if(!Calligo01MapData)
		{
			console.log("Err: Global map data missing");
			return;
		}
		
		console.log("Found map data with " + Calligo01MapData.length + " objs");
		
		if(!Calligo01GroupData)
		{
			console.log("Err: Global group data missing");
			return;
		}

		console.log("Found group data with " + Calligo01GroupData.length + " objs");

		//let MapGroupNames = getmapGroups(worldData);
		//console.log(MapGroupNames);
	
		let mapGroups = this.groupMapObjects(Calligo01GroupData, Calligo01MapData);
		
		for(let i =0; i < mapGroups.length; i++)
		{
			let mapGrp = mapGroups[i];
			let heatData = [];
			
			//Attempt to find a matching layer for this map group
			this.map.eachLayer(function(layer){
				if(layer.name == mapGrp.GroupName)
				{
					//Match on this layer, abort the function, duplicate names not supported
					console.log("Duplicate map grp name not supported")
					return;
				}
			});
			
			if(!mapGrp.MapObjs)
			{
				console.log("mapGrp \'" + mapGrp.GroupName + "\' has no attached MapObjs, will be skipped");
				continue;
			}
			
			console.log("Creating " + mapGrp.GroupName + " group layer with " + mapGrp.MapObjs.length + " objs");
				
			let group = L.layerGroup();
			let popupOptions = { maxWidth: 500 };
			
			let mapBorderPoints = [];
			
			for(let j = 0; j < mapGrp.MapObjs.length; j++)
			{
				let worldObj = mapGrp.MapObjs[j];
				let mapPos = GamePosToMapPos(worldObj.Pos);
				let shapes = [];
				
				//Handle our click/popup text
				let popupText = "";
				if(worldObj.AltName)
				{
					popupText += `Name: ${worldObj.AltName}<br>`;
				}
				popupText += `Obj-Name: ${worldObj.Name}<br>Map Pos: ${[mapPos.Y, mapPos.X]}`;
				
				//Actually create the shapes
				if (worldObj.Name.includes("BPMapBorderActor"))
				{
					//TODO this should be moved as it now has nothing to do with the worldObj itself
					//Also cursed magic numbers for testing
					const RegionsHeight = 3;
					const RegionsWidth = 2;
					const BorderSize = 9200;
					const MagicBorders = L.latLngBounds([1094952.1,-236735.72],[-180957.83,603644.3]);//Based of the map border obj positions

					//Cursed
					const manualWidth = MagicBorders.getEast() - MagicBorders.getWest();
					const manualHeight = MagicBorders.getNorth() - MagicBorders.getSouth();
					
					const RegionWidth = manualWidth / RegionsWidth; //mapWidth
					const RegionHeight = manualHeight / RegionsHeight; //mapHeight

					const MapTop =  MagicBorders.getNorth(); //this.mapSettings.MapBounds.getNorth();
					const MapLeft = MagicBorders.getWest();//this.mapSettings.MapBounds.getWest();
					const MapBottom = -124191.83; //MagicBorders.getSouth(); //Manual replace for border resize but we want to keep hoz borders the same
					
					//Look! More magic numbers!
					const MapTopOffset = MapTop - 64000; //Used by horizontal borders for offset from the top
					const MapLeftOffset = MapLeft - 0//15000;//Used by vertical borders for offset from the left
					
					//Vertical Region Borders
					for(let rH = 1; rH <= RegionsHeight; rH++)
					{
						for(let rW = 1; rW <= RegionsWidth-1; rW++)
						{
							//Remember its Y,X
							const TopLeft = [MapTop - (RegionHeight * (rH-1)), MapLeftOffset + ((RegionWidth * rW) - (BorderSize/2))];
							const BottomRight = [Math.max(MapTop - (RegionHeight * (rH)),MapBottom), MapLeftOffset + ((RegionWidth * rW) + (BorderSize/2))];
							const bounds = [TopLeft, BottomRight];
							
							console.log("Bottom right ", BottomRight, MapBottom);
							
							let col = "#ff7800" //`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`;
							
							shapes.push(L.rectangle(bounds, { color: col, weight: 2 }).bindPopup(popupText, popupOptions));
						}
					}
					
					//Horizontal Region Borders
					for(let rH = 1; rH <= RegionsHeight - 1; rH++)
					{
						for(let rW = 1; rW <= RegionsWidth; rW++)
						{
							//Remember its Y,X
							const TopLeft = [MapTopOffset - ((RegionHeight * rH) - (BorderSize/2)), MapLeft + (RegionWidth * (rW - 1))];
							const BottomRight = [MapTopOffset - (RegionHeight * rH) - (BorderSize/2), MapLeft + (RegionWidth * rW)];
							const bounds = [TopLeft, BottomRight];
							
							let col = "#ff7800"; //`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`;
							
							shapes.push(L.rectangle(bounds, { color: col, weight: 2 }).bindPopup(popupText, popupOptions));
						}
					}
				}
				else if (worldObj.Name.includes("BorderNorth"))
				{
					//Map Borders... they're all called BorderNorth
					//We just need to workout which point is which (in any order)
					if(mapBorderPoints.length == 3)
					{
						let leftPos = 0;
						let rightPos = 0;
						let topPos = 0;
						let bottomPos = 0;
						
						mapBorderPoints.push(mapPos);
						
						for(let i = 0; i < mapBorderPoints.length; i++)
						{
							if(mapBorderPoints[i].X < leftPos)
							{
								leftPos = mapBorderPoints[i].X;
							}
							
							if(mapBorderPoints[i].X > rightPos)
							{
								rightPos = mapBorderPoints[i].X;
							}
							
							if(mapBorderPoints[i].Y > topPos)
							{
								topPos = mapBorderPoints[i].Y;
							}
							
							if(mapBorderPoints[i].Y < bottomPos)
							{
								bottomPos = mapBorderPoints[i].Y;
							}
						}
						
						//We should have worked out points positions now
						//if not I'm sure this is going to be jank
						let bounds = [[topPos,leftPos],[bottomPos,rightPos]];
						shapes.push(L.rectangle(bounds, { color: "red", fillColor: 'transparent', weight: 2, interactive: false }));
						
						console.log("Set MapRawBounds", bounds);
					}
					else
					{
						mapBorderPoints.push(mapPos);
					}
				}
				else
				{
					//Check if this obj has an image and plcae it within the bounds of our shape
					if(mapGrp.ImgName != null)
					{
						//Select the correct radius for the shape
						let rads = mapGrp.Radius;
						if(mapGrp.InsideRadius && mapGrp.InsideRadius > 0)
						{
							rads = mapGrp.InsideRadius;
						}
						
						let topLeftY = mapPos.Y - (rads * (mapGrp.ImgScale / 100));
						let topLeftX = mapPos.X - (rads * (mapGrp.ImgScale / 100));
							
						let bottomRightY = mapPos.Y + (rads * (mapGrp.ImgScale / 100));
						let bottomRightX = mapPos.X + (rads * (mapGrp.ImgScale / 100));
													
						const topLeft = [topLeftY, topLeftX];
						const bottomRight = [bottomRightY, bottomRightX];

						const imgBounds = L.latLngBounds(topLeft, bottomRight);
							
						shapes.push(L.imageOverlay("./img/icons/" + mapGrp.ImgName, imgBounds, {opacity: 0.7, className: 'ResImg'}));
						
						//let debug = L.rectangle(ImgBounds, { color: "red", weight: 1 });
						//group.addLayer(debug);
					}

					//Some areas should be donut shaped with a minimum radius
					if(mapGrp.InsideRadius > 0)
					{
						shapes.push(L.donut([mapPos.Y, mapPos.X],{ radius: mapGrp.Radius, innerRadius: mapGrp.InsideRadius, color: mapGrp.HexColour}).bindPopup(popupText, popupOptions));
					}
					else
					{
						//Main circle shape for most objects
						if(mapGrp.GroupName == "Location Markers")
						{
							shapes.push(L.marker([mapPos.Y, mapPos.X], { opacity: 0 }).bindTooltip(worldObj.AltName, {permanent: true, direction: "center", className: "tooltipLabels", offset: [-20, 30] }));
						}
						else
						{
							shapes.push(L.circle([mapPos.Y, mapPos.X], { radius: mapGrp.Radius, color: mapGrp.HexColour }).bindPopup(popupText, popupOptions));
						}
						
						//Testing heatmap stuff, duplicate data points for effect
						if(this.mapSettings.DebugDoHeatMap)
						{
							let posMultiplier = 5;
							if(worldObj.AltName && worldObj.AltName.includes("Branch"))
							{
								posMultiplier = 100;
							}
							
							for(let i = 0; i < posMultiplier; i++)
							{
								heatData.push([mapPos.Y, mapPos.X]);
							}
						}
					}
				}
				
				//Add any shapes/layers into our group
				for(let s = 0; s < shapes.length; s++)
				{
					group.addLayer(shapes[s]);
				}
			}
			
			//Tag our group of layers with a group name under a its parent group name
			if(mapGrp.ParentGroupName)
			{
				this.groupLayerController.addOverlay(group, mapGrp.GroupName, mapGrp.ParentGroupName);
				
				if(mapGrp.GroupName == "Location Markers")
				{
					group.addTo(this.map);
				}
				
				if(this.mapSettings.DebugDoHeatMap && heatData.length > 0)
				{
					//Good heat values for trees
					//TODO tweak values for other object types
					let HeatLayer = L.heatLayer(heatData, 
					{
						radius:20,
						blur: 0,
						maxZoom: 1,
					});
					
					this.groupLayerController.addOverlay(HeatLayer, mapGrp.GroupName + " Heat", mapGrp.ParentGroupName);
				}
			}
			else
			{
				this.groupLayerController.addOverlay(group, mapGrp.GroupName, "Misc");
			}
		}
	
		console.log("Finished world obj mapping");
	},
	/*Attach map objects onto their parent group via GroupID*/
	groupMapObjects: function(groupObjs, mapObjs)
	{
		for(let i=0; i < groupObjs.length; i++)
		{
			for(let j =0; j < mapObjs.length; j++)
			{
				if(groupObjs[i].GroupID == mapObjs[j].GroupID)
				{
					if(!groupObjs[i].MapObjs){
						groupObjs[i].MapObjs = [mapObjs[j]];
						continue;
					}
						
					groupObjs[i].MapObjs.push(mapObjs[j]);
				}
			}
		}
		
		return groupObjs;
	},
	insertMapCrossingPaths: function()
	{
		let pathOptions = { color: 'blue', weight: 5, opacity: 1 };
		
		let crossing1 = L.polyline( [[433280, -50624], [428992, -50624]], pathOptions).bindPopup("Two way crossing");
		let crossing2 = L.polyline( [[434368, -145088], [432576, -144256]], pathOptions).bindPopup("Two way crossing");
		let crossing3 = L.polyline( [[512000, -128448], [512832, -130432]], pathOptions).bindPopup("One way crossing, bottom/right to top/left only");
		let crossing4 = L.polyline( [[474816, -130816], [472768, -129472]], pathOptions).bindPopup("Two way crossing");
		let crossing5 = L.polyline( [[440064, -163648], [438144, -165056]], pathOptions).bindPopup("Two way crossing");
		let crossing6 = L.polyline( [[122304, -37696], [120192, -36864]], pathOptions).bindPopup("Two way crossing");
		
		let crossingsGrp = L.layerGroup();
		crossingsGrp.addLayer(crossing1);
		crossingsGrp.addLayer(crossing2);
		crossingsGrp.addLayer(crossing3);
		crossingsGrp.addLayer(crossing4);
		crossingsGrp.addLayer(crossing5);
		crossingsGrp.addLayer(crossing6);
		
		this.groupLayerController.addOverlay(crossingsGrp, "River Crossings", "General");
	}
};

class UIInterfaceController
{
	addShapeToDrawLayer(shape)
	{
		let drawLayer = leafMap.groupLayerController.findFirstLayerInGroup("Draw");
		if(drawLayer)
		{
				if(drawLayer.control && !drawLayer.control.checked)
				{
					drawLayer.control.click();
				}
				
				drawLayer.addLayer(shape);
				
				console.log("Added shape to draw group");
				
				return;
		}
		else
		{
			let drawGroup = L.layerGroup();
			drawGroup.id = 'CustomDraw';
			drawGroup.addLayer(shape);
			drawGroup.addTo(leafMap.map);
			
			leafMap.groupLayerController.addOverlay(drawGroup, "Custom Shapes", "Draw");
			
			console.log("Created new draw group");
		}
	}
	clearDrawLayer(e)
	{
		//Find and clear our draw layer
		let drawLayers = leafMap.groupLayerController.findLayersByGroupName('Draw');
		if(drawLayers)
		{
			for(const layerId in drawLayers)
			{
				const drawGroup = drawLayers[layerId];
				
				if(drawGroup && drawGroup.id == "CustomDraw" && drawGroup.control && drawGroup.control.checked === true)
				{
					console.log("Clearing draw group");
					drawGroup.clearLayers();
					return;
					
					//Version that would check if mouse event was inside bounds of a shape to remove draw layer
					/*for(const groupLayerId in drawGroup._layers)
					{
						let layer = drawGroup._layers[groupLayerId];
						if(layer.getBounds && layer.getBounds().contains(e.latlng))
						{
							console.log("Clearing draw group " + layer);
							drawGroup.clearLayers();
							return;
						}
					}*/
				}
			}
		}
	}
}

//Define static map settings
class MapSettings
{
	MapHeight = 1110000;
	MapWidth = 800000;
	YOriginOffset = -423130;
	XOriginOffset = 197310;
	PosYOffset = 0;
	PosXOffset = 0;
	MapBounds = L.latLngBounds([0,0],[0,0]); //MapHeight and MapWidth form this bounds with the offset, this only applies to the content inside the map image
	MapImage = './img/AnvilMap_Nov27.png';
	MapTreeImage = './img/AnvilMapTreeLayerCustom.png';
	MapTreeOverlayYOffset = 0;
	MapTopoImage = './img/GigaMap_TopgoGraphic.png';
	MapImageOld = './img/AnvilMapOld.png';
	GridWidth = 20;
	GridHeight = 30;
	GridMarkers = true;
	DebugDoHeatMap = false;
	constructor() 
	{
		this.PosYOffset = (this.MapHeight / 2) -  Math.abs(this.YOriginOffset);
		this.PosXOffset = (this.MapWidth / 2)  - Math.abs(this.XOriginOffset);
		this.MapBounds = L.latLngBounds([this.PosYOffset * -1, this.PosXOffset * -1], [this.MapHeight - this.PosYOffset, this.MapWidth - this.PosXOffset]);
	}
}

leafMap.init();

/*Misc Functions and classes*/

//Convert a game map position to a leaflet map world position
function GamePosToMapPos(pos)
{
	return {
		Y: pos.Y * -1,
		X: pos.X
	};
}

/*Add a setable ID onto layer groups*/
L.LayerGroup.include({
    customGetLayer: function (id) {
        for (var i in this._layers) {
            if (this._layers[i].id == id) {
               return this._layers[i];
            }
        }
    }
});