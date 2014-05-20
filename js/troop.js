/*

Troop - In-browser avatar generator
Copyright (C) 2014 tombazza

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

(function ($) {

	var layerData,
		bodyCanvasWidth = 91,
		layerMargin = 10,
		layerAllowMany = {
			body: false,
			hair: true,
			hats: true,
			pants: false,
			bottoms: false,
			tops: true,
			shoes: false,
			extras: false
		};

	function load() {
		$(window).resize(onResize);
		$('#generator #body .clear').click(clearLayers);
		$('#generator #body .save').click(saveImage);
		onResize();
		getLayerData();
	}

	function clearLayers(e) {
		$('#generator #body .layer').html('');
		$('#viewer .section .layer').removeClass('selected');
		e.preventDefault();
	}

	function saveImage() {
		var imageStack = [];
		var loadRemains = 0;
		var stackPosition = 0;
		var buffer = document.createElement('canvas');
		buffer.width = 91;
		buffer.height = 139;
		var context = buffer.getContext('2d');
		var toLoad = [];

		toLoad[0] = {
			url: 'assets/skeleton.gif',
			posn: [0, 0]
		};

		var items = $('#generator #body .item');

		items.each(function (key) {
			stackPosition = stackPosition + 1;
			var curImgPosn = stackPosition;
			var posn = $(this).css('background-position').replace(/px/g, '').split(' ');
			var imgUrl = $(this).attr('itemurl');

			toLoad[curImgPosn] = {
				url: imgUrl,
				posn: posn
			};
		});

		processQueue();

		function processQueue() {
			for (i = 0; i < toLoad.length; i++) {
				loadRemains = loadRemains + 1;
				var curImg = toLoad[i];
				console.log(curImg);
				imageStack[i] = {
					image: new Image(),
					posn: curImg.posn
				};
				imageStack[i].image.onload = function () {
					loadRemains = loadRemains - 1;
					renderImage();
				};
				imageStack[i].image.src = curImg.url;
			}
		}

		function renderImage() {
			if (loadRemains === 0) {
				console.log(imageStack);
				$.each(imageStack, function (key, item) {
					context.drawImage(item.image, item.posn[0], item.posn[1]);
				});
				var d = new Date();
				var dateString = '' + d.getDate() + (d.getMonth() + 1) + d.getYear() + d.getHours() + d.getMinutes() + d.getSeconds();
				buffer.toBlob(function (blob) {
					saveAs(blob, 'avatar_' + dateString + '.png');
				});
			}
		}
	}

	function getLayerData() {
		$.getJSON("wardrobe.json", function (data) {
			layerData = data;
			generateLayers();
		});
	}

	function generateLayers() {
		var tabs = $('#generator ul.tabs');
		var viewer = $('#viewer');
		for (name in layerData) {
			tabs.append($('<li id="tab_' + name + '">' + ucfirst(name) + '</li>'));
			var images = layerData[name];
			var viewerHtml = '<div class="section" id="section_' + name + '" style="width: ' + (images.length * (layerMargin + bodyCanvasWidth)) + 'px">';
			$.each(images, function (i, image) {
				var url = 'assets/' + name + '/' + image;
				try {
					var posn = image.split('-')[1].replace('.gif', '').split('x');
					viewerHtml += '<div class="layer" style="background-image:url(' + url + ');background-position:' + posn[0] + 'px ' + posn[1] + 'px" rel="' + image + '"></div>';
				} catch (err) {}
			});
			viewerHtml += '</div>';
			viewer.append($(viewerHtml));
		}
		$('#generator ul.tabs li').click(tabClick);
		$('#generator #viewer .section:first').show();
		$('#generator ul.tabs li:first').addClass('selected');
		$('#generator #viewer .layer').click(clickLayer);
	}

	function tabClick(e) {
		var id = $(this).attr('id').replace('tab_', '');
		$('#generator #viewer .section').hide();
		$('#generator ul.tabs li').removeClass('selected');
		$('#section_' + id).show();
		$(this).addClass('selected');
		e.preventDefault();
	}

	function clickLayer(e) {
		var image = $(this).attr('rel');
		var parent = $(this).parent('.section').attr('id').replace('section_', '');
		// add layer to body image
		var selector = '#generator #body #layer_' + parent;
		var url = 'assets/' + parent + '/' + image;

		// determine if we are allowed multiple on this layer
		var itemId = clean('layer_item_' + parent + '_' + image);
		if ($('#' + itemId).length) {
			$('#' + itemId).remove();
			$(this).removeClass('selected');
		} else {
			if (!layerAllowMany[parent]) {
				$(selector).html('');
				$('#section_' + parent + ' .layer').removeClass('selected');
			}
			$(selector).append($('<div id="' + itemId + '" class="item" style="background-image:url(' + url + ');background-position:' + $(this).css('background-position') + '" itemurl="' + url + '"></div>'));
			$(this).addClass('selected');
		}
	}

	function onResize() {
		setViewerWidth();
	}

	function setViewerWidth() {
		var freeSpace = ($('#generator').width() - 115);
		$('#viewer').width(freeSpace);
	}

	function ucfirst(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function clean(string) {
		response = string.replace('.', '');
		output = response.replace('-', '');
		return output;
	}

	$(document).ready(load);

})(jQuery);
