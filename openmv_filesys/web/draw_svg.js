function get_draw_scale(zoom, scale_vert)
{
    var wrapdiv = document.getElementById("viewme");
    var imgw = wrapdiv.clientWidth;
    var imgh = Math.round((imgw / dataw) * datah);
    var imgscale = dataw / imgw;
    if (scale_vert)
    {
        var reduce = 0;
        while (imgh > screen.height * 0.8) {
            reduce += 10;
            imgw = imgdiv.clientWidth - reduce;
            imgh = Math.round((imgw / dataw) * datah);
            imgscale = dataw / imgw;
        }
    }
    imgscale /= zoom;
    return [dataw, datah, imgw, imgh, imgscale];
}

function get_zoom()
{
    var zoom = 1;
    if ($("#viewmode-2").prop("checked")) {
        zoom = 2;
    }
    if ($("#viewmode-3").prop("checked")) {
        zoom = 4;
    }
    if ($("#viewmode-4").prop("checked")) {
        zoom = 8;
    }
    return zoom;
}

function draw_svg(obj, zoom, need_reload, scale_vert, jpgdata, ghost_results)
{
    var svgNS = "http://www.w3.org/2000/svg";

    var wrapdiv = document.getElementById("viewme");
    var imgdiv = document.getElementById("viewmesvg");
    var jpegdiv = document.getElementById("viewmejpeg");
    var jpegele = document.getElementById("imgjpeg");

    var stars = obj["stars"];

    if (zoom <= 1) {
        zoom = 1;
    }

    if (need_reload) {
        while (imgdiv.firstChild) {
            imgdiv.removeChild(imgdiv.firstChild);
        }
    }

    d = get_draw_scale(zoom, scale_vert);
    var dataw = d[0];
    var datah = d[1];
    var imgw = d[2];
    var imgh = d[3];
    var imgscale = d[4];

    var cent_x = settings["center_x"] / imgscale;
    var cent_y = settings["center_y"] / imgscale;
    var offset_x = 0, offset_y = 0;

    if (zoom > 1) {
        offset_x = cent_x - (imgw / 2);
        offset_y = cent_y - (imgh / 2);
    }

    // start the canvas with correct size
    var svgele = document.createElementNS(svgNS, "svg");
    while (imgdiv.firstChild) {
        imgdiv.removeChild(imgdiv.firstChild);
    }
    //imgdiv.setAttribute("height", imgh);
    //imgdiv.style.height  = imgh + "px";
    imgdiv.style.top  = "-" + imgh + "px";
    wrapdiv.style.height = imgh + "px";
    jpegdiv.style.height = imgh + "px";

    var cirele;

    if (jpegele != null && jpegele != undefined)
    {
        if (jpgdata !== false && jpgdata !== null && jpgdata !== undefined) {
            jpegele.style.width = imgw + "px";
            jpegele.style.height = imgh + "px";
            jpegele.style.opacity = "1.0";
        }
        else {
            var divele = document.getElementById("viewmejpeg");
            while (divele.firstChild) {
                divele.removeChild(divele.firstChild);
            }
            jpegele.style.opacity = "0.0";
        }
    }

    svgele.setAttribute("id", "imgsvg");
    svgele.setAttribute("width", imgw);
    svgele.setAttribute("height", imgh);

    svgele.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgele.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    if (jpgdata === false || jpgdata === null || jpgdata === undefined) {
        // draw a background rectangle that represents the background colour
        var bgrect = document.createElementNS(svgNS, "rect");
        bgrect.setAttribute("width", imgw);
        bgrect.setAttribute("height", imgh);
        bgrect.setAttribute("x", 0);
        bgrect.setAttribute("y", 0);
        var bgc = Math.round(obj["img_mean"] * 0.9).toString();
        bgrect.setAttribute("style", "fill:rgb(" + bgc + "," + bgc + "," + bgc + ");stroke:none;");
        svgele.appendChild(bgrect);
    }

    // draw each star
    var maxr = 0;
    stars.forEach(function(ele, idx) {
        if (ele["r"] > maxr) {
            maxr = ele["r"];
        }
    });
    if (jpgdata === false || jpgdata === null || jpgdata === undefined)
    {
        stars.forEach(function(ele, idx) {
            var cx = ele["cx"];
            var cy = ele["cy"];
            
            var ishot = false;
            hotpixels.forEach(function(ele, idx) {
                var v = math_getVector([cx, cy], ele);
                if (v[0] < 2) {
                    ishot = true;
                }
            });
            if (ishot == false)
            {
                cirele = document.createElementNS(svgNS, "circle");
                cirele.setAttribute("cx", Math.round((cx / imgscale) - offset_x));
                cirele.setAttribute("cy", Math.round((cy / imgscale) - offset_y));
                cirele.setAttribute("r", Math.round(ele["r"]));
                cirele.setAttribute("style", "fill:rgb(255,255,255);stroke:none;");
                svgele.appendChild(cirele);
            }
        });
    }

    var cline = document.createElementNS(svgNS, "line");
    cline.setAttribute("x1", Math.round(cent_x - offset_x));
    cline.setAttribute("x2", Math.round(cent_x - offset_x));
    cline.setAttribute("y1", Math.round(cent_y - offset_y + (imgh * 0.2)));
    cline.setAttribute("y2", Math.round(cent_y - offset_y - (imgh * 0.2)));
    cline.setAttribute("style", "stroke:yellow;stroke-width:1");
    svgele.appendChild(cline);
    cline = document.createElementNS(svgNS, "line");
    cline.setAttribute("y1", Math.round(cent_y - offset_y));
    cline.setAttribute("y2", Math.round(cent_y - offset_y));
    cline.setAttribute("x1", Math.round(cent_x - offset_x + (imgh * 0.2)));
    cline.setAttribute("x2", Math.round(cent_x - offset_x - (imgh * 0.2)));
    cline.setAttribute("style", "stroke:yellow;stroke-width:1");
    svgele.appendChild(cline);

    if (obj["solution"])
    {
        if (obj["star_x"] && obj["star_y"] && obj["pole_x"] && obj["pole_y"])
        {
            // we need to draw the matched stars even though the stars have already been draw
            // this will prevent hot pixels from hiding an important star
            if ((jpgdata === false || jpgdata === null || jpgdata === undefined) && hotpixels.length > 0)
            {
                var solstars = obj["solution"]["matches"];
                solstars.forEach(function(ele, idx) {
                    var cx = ele["cx"];
                    var cy = ele["cy"];
                    var cirele = document.createElementNS(svgNS, "circle");
                    cirele.setAttribute("cx", Math.round((cx / imgscale) - offset_x));
                    cirele.setAttribute("cy", Math.round((cy / imgscale) - offset_y));
                    cirele.setAttribute("r", Math.round(ele["r"]));
                    cirele.setAttribute("style", "fill:rgb(255,255,255);stroke:none;");
                    svgele.appendChild(cirele);
                });
            }

            var sc_x = obj["star_x"];
            var sc_y = obj["star_y"];

            var notinview = (sc_x < 0 || sc_x > imgw || sc_y < 0 || sc_y > imgh);

            if (hotpixels.length > 0 && notinview == false)
            {
                cirele = document.createElementNS(svgNS, "circle");
                cirele.setAttribute("cx", Math.round((sc_x / imgscale) - offset_x));
                cirele.setAttribute("cy", Math.round((sc_y / imgscale) - offset_y));
                cirele.setAttribute("r", maxr);
                cirele.setAttribute("style", "fill:white;stroke:none;");
                svgele.appendChild(cirele);
            }

            cirele = document.createElementNS(svgNS, "circle");
            cirele.setAttribute("cx", Math.round((sc_x / imgscale) - offset_x));
            cirele.setAttribute("cy", Math.round((sc_y / imgscale) - offset_y));
            cirele.setAttribute("r", 5);
            cirele.setAttribute("style", "fill:green;stroke:none;");
            svgele.appendChild(cirele);

            if (notinview)
            {
                var tline = document.createElementNS(svgNS, "line");
                tline.setAttribute("x1", Math.round(cent_x - offset_x));
                tline.setAttribute("x2", Math.round(sc_x - offset_x));
                tline.setAttribute("y1", Math.round(cent_y - offset_y));
                tline.setAttribute("y2", Math.round(sc_y - offset_y));
                tline.setAttribute("style", "stroke:green;stroke-width:1");
                svgele.appendChild(tline);
            }

            var poly = document.createElementNS(svgNS, "polygon");
            var px = (obj["pole_x"] / imgscale) - offset_x;
            var py = (obj["pole_y"] / imgscale) - offset_y;
            var len = 7, cor = 4;
            if (len < maxr) {
                len = maxr;
            }

            if ($( "#chkrefraction-1").prop("checked"))
            {
                var refractionRotation = obj["rotation"] - obj["polar_clock"];
                var movedP = math_movePointTowards([px, py], [obj["refraction"] / imgscale, refractionRotation + 90.0]);
                px = movedP[0];
                py = movedP[1];
            }

            var points = (px - 1).toString() + "," + (py - 1).toString() + " ";
            points += (px - 1).toString() + "," + (py - 1 - len).toString() + " ";
            points += (px - cor).toString() + "," + (py - cor).toString() + " ";
            points += (px - 1 - len).toString() + "," + (py - 1).toString() + " ";
            poly.setAttribute("points", points.trim());
            poly.setAttribute("style", "fill:rgb(255,0,0);stroke:none;");
            svgele.appendChild(poly);
            poly = document.createElementNS(svgNS, "polygon");
            points = (px + 1).toString() + "," + (py - 1).toString() + " ";
            points += (px + 1).toString() + "," + (py - 1 - len).toString() + " ";
            points += (px + cor).toString() + "," + (py - cor).toString() + " ";
            points += (px + 1 + len).toString() + "," + (py - 1).toString() + " ";
            poly.setAttribute("points", points.trim());
            poly.setAttribute("style", "fill:rgb(255,0,0);stroke:none;");
            svgele.appendChild(poly);
            poly = document.createElementNS(svgNS, "polygon");
            points = (px + 1).toString() + "," + (py + 1).toString() + " ";
            points += (px + 1).toString() + "," + (py + 1 + len).toString() + " ";
            points += (px + cor).toString() + "," + (py + cor).toString() + " ";
            points += (px + 1 + len).toString() + "," + (py + 1).toString() + " ";
            poly.setAttribute("points", points.trim());
            poly.setAttribute("style", "fill:rgb(255,0,0);stroke:none;");
            svgele.appendChild(poly);
            poly = document.createElementNS(svgNS, "polygon");
            points = (px - 1).toString() + "," + (py + 1).toString() + " ";
            points += (px - 1).toString() + "," + (py + 1 + len).toString() + " ";
            points += (px - cor).toString() + "," + (py + cor).toString() + " ";
            points += (px - 1 - len).toString() + "," + (py + 1).toString() + " ";
            poly.setAttribute("points", points.trim());
            poly.setAttribute("style", "fill:rgb(255,0,0);stroke:none;");
            svgele.appendChild(poly);

            if (px < 0 || px > imgw || py < 0 || py > imgh)
            {
                var tline = document.createElementNS(svgNS, "line");
                tline.setAttribute("x1", Math.round(cent_x - offset_x));
                tline.setAttribute("x2", Math.round(px - offset_x));
                tline.setAttribute("y1", Math.round(cent_y - offset_y));
                tline.setAttribute("y2", Math.round(py - offset_y));
                tline.setAttribute("style", "stroke:red;stroke-width:1");
                svgele.appendChild(tline);
            }

            if (ghost_results !== null && ghost_results !== false)
            {
                if (ghost_results.cent_x != null && ghost_results.cent_x != 0 && ghost_results.cent_y != null && ghost_results.cent_y != 0)
                {
                    var gline = document.createElementNS(svgNS, "line");
                    gline.setAttribute("x1", Math.round((ghost_results.cent_x / imgscale) - offset_x));
                    gline.setAttribute("x2", Math.round((ghost_results.mp1_x  / imgscale) - offset_x));
                    gline.setAttribute("y1", Math.round((ghost_results.cent_y / imgscale) - offset_y));
                    gline.setAttribute("y2", Math.round((ghost_results.mp1_y  / imgscale) - offset_y));
                    gline.setAttribute("style", "stroke:blue;stroke-width:1");
                    svgele.appendChild(gline);
                    gline = document.createElementNS(svgNS, "line");
                    gline.setAttribute("x1", Math.round((ghost_results.cent_x / imgscale) - offset_x));
                    gline.setAttribute("x2", Math.round((ghost_results.mp2_x  / imgscale) - offset_x));
                    gline.setAttribute("y1", Math.round((ghost_results.cent_y / imgscale) - offset_y));
                    gline.setAttribute("y2", Math.round((ghost_results.mp2_y  / imgscale) - offset_y));
                    gline.setAttribute("style", "stroke:blue;stroke-width:1");
                    svgele.appendChild(gline);
                    gline = document.createElementNS(svgNS, "line");
                    gline.setAttribute("x1", Math.round((ghost_results.star_x   / imgscale) - offset_x));
                    gline.setAttribute("x2", Math.round((ghost_results.ghost_sx / imgscale) - offset_x));
                    gline.setAttribute("y1", Math.round((ghost_results.star_y   / imgscale) - offset_y));
                    gline.setAttribute("y2", Math.round((ghost_results.ghost_sy / imgscale) - offset_y));
                    gline.setAttribute("style", "stroke:blue;stroke-width:1");
                    svgele.appendChild(gline);
                    gline = document.createElementNS(svgNS, "line");
                    gline.setAttribute("x1", Math.round((ghost_results.pole_x   / imgscale) - offset_x));
                    gline.setAttribute("x2", Math.round((ghost_results.ghost_px / imgscale) - offset_x));
                    gline.setAttribute("y1", Math.round((ghost_results.pole_y   / imgscale) - offset_y));
                    gline.setAttribute("y2", Math.round((ghost_results.ghost_py / imgscale) - offset_y));
                    gline.setAttribute("style", "stroke:blue;stroke-width:1");
                    svgele.appendChild(gline);
                }
            }
        }
    }

    if (ghost !== null && ghost !== false)
    {
        var gcir = document.createElementNS(svgNS, "circle");
        gcir.setAttribute("cx", Math.round((ghost.star_x / imgscale) - offset_x));
        gcir.setAttribute("cy", Math.round((ghost.star_y / imgscale) - offset_y));
        gcir.setAttribute("r", 3);
        gcir.setAttribute("style", "stroke:blue;stroke-width:2");
        svgele.appendChild(gcir);
        gcir = document.createElementNS(svgNS, "rect");
        var cx = Math.round((ghost.pole_x / imgscale) - offset_x);
        var cy = Math.round((ghost.pole_y / imgscale) - offset_y);
        gcir.setAttribute("x", cx - 2);
        gcir.setAttribute("y", cy - 2);
        gcir.setAttribute("width", 4);
        gcir.setAttribute("height", 4);
        gcir.setAttribute("style", "stroke:blue;stroke-width:2");
        svgele.appendChild(gcir);
    }

    imgdiv.appendChild(svgele);
}