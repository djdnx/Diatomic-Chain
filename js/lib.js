/* Define an anonymous self invoking function, called with the lib object as its argument
to act as a namespace. lib.runApp is then called in app.js  */
var lib = {};

(function (ns) {

  //Set up the circles
  ns.drawCircles = function(two) {

    var latticeParameter = two.width / ( this.params.nCircles + 1 ) * 2, //Separation of equilibrium positions
        smallRadius = 20, largeRadius = 30 //Radii in pixels
    var smallMass = 1, largeMass = 2

    this.params.latticeParameter = latticeParameter //Set now that the two instance size is known
    this.params.waveNumber = 1 / 2 * Math.PI / latticeParameter //Set to default initial value
    //Instantiate the circles, set their initial positions and store them for future use in circleArray
    var circleArray = [], n
    for ( var i = 0; i < this.params.nCircles; i++ ) {

      n = i + 1 //Modified counter
      // Equilibrium position of the nth circle. Count from 1 so that the first circle is not at the edge of the canvas
      var equilibriumPosition = n * latticeParameter / 2

      // Even index (counting from 0 from left to right on the page) are small, low mass, red circles
      if ( i % 2 === 0 ) {

        // Draw vertical lines to mark the equilibrium points
        var verticalLineLength = 3 * smallRadius // Length of the line marking the equilibrium position
        // Draw the line
        var midLine = two.makeLine( equilibriumPosition , two.height / 2 - verticalLineLength / 2 , equilibriumPosition , two.height / 2 + verticalLineLength / 2 )

        // Draw the circle of correct radius at its equilibrium position and half way up the two instance
        circleArray.push( two.makeCircle( equilibriumPosition , two.height / 2 , smallRadius) )
        circleArray[i].mass = smallMass //Assign small mass to this circle

        // Red in colour
        circleArray[i].fill = 'red'
        circleArray[i].stroke = 'red'
        midLine.stroke = 'red'
      }
      // For odd indices, assign a larger, high mass, blue circle
      else if (i % 2 !== 0) {

        // Draw vertical lines to mark the equilibrium points as before
        var verticalLineLength = 3 * largeRadius
        var midLine = two.makeLine( equilibriumPosition , two.height / 2 - verticalLineLength / 2 , equilibriumPosition , two.height / 2 + verticalLineLength / 2 )
        // Draw the circle
        circleArray.push( two.makeCircle( equilibriumPosition , two.height / 2 , largeRadius) )
        circleArray[i].mass = largeMass //Larger mass for this index

        // Blue in colour
        circleArray[i].fill = 'blue'
        circleArray[i].stroke = 'blue'
        midLine.stroke = 'blue'
      }

      circleArray[i].equilibrium = equilibriumPosition //Store for future use

    }

    //Return the array of circles each carrying mass and equilibrium positions
    return {
      circles: circleArray,
    }
  }


  /* Function which returns omega and the amplitudes for the motion of both optical and acoustic modes
  m1 == large mass , m2 == small mass , a == lattice parameter, q == wavenumber, take unity spring constant */
  ns.dispersion = function(m1,m2,a,q) {
    // Optical branch omega
    var omegaOpticSquared = 1/m1 + 1/m2 + Math.sqrt( 1/(m1*m1) + 1/(m2*m2) + 2/(m1*m2)*Math.cos(q*a) ), //Angular frequency in rad/s
        omegaOptic = Math.sqrt( omegaOpticSquared )

    // Acoustic branch omega
    var omegaAcousticSquared = 1/m1 + 1/m2 - Math.sqrt( 1/(m1*m1) + 1/(m2*m2) + 2/(m1*m2)*Math.cos(q*a) ), //Angular frequency in rad/s
        omegaAcoustic = Math.sqrt( omegaAcousticSquared )

    /* Set the oscillation amplitudes of the springs.
    Alpha is the ratio between the amplitudes of the low mass and high mass atoms.
    So that the oscillations stay on the page, set A as the larger of the two amplitudes and scale accordingly. */

    var A = a / 12 // Max amplitude in pixels

    //Find the ratios
    var alphaOptic = (2 - omegaOpticSquared*m1) / ( 2 * Math.cos(q*a/2) ),
        alphaAcoustic = (2 - omegaAcousticSquared*m1) / ( 2 * Math.cos(q*a/2) )

    // Set A to be the larger of the two amplitudes for each set of modes
    if ( Math.abs(alphaOptic) > 1 ) {
      var lowMassAmplitudeOptic = A,
          highMassAmplitudeOptic = A / alphaOptic
    } else {
      var lowMassAmplitudeOptic = A * alphaOptic,
          highMassAmplitudeOptic = A
    }
    if ( Math.abs(alphaAcoustic) > 1 ) {
      var lowMassAmplitudeAcoustic = A,
          highMassAmplitudeAcoustic = A / alphaAcoustic
    } else {
      var lowMassAmplitudeAcoustic = A * alphaAcoustic,
          highMassAmplitudeAcoustic = A
    }

    // Return the frequencies and amplitudes
    return {
      omegaOptic: omegaOptic,
      lowMassAmplitudeOptic: lowMassAmplitudeOptic,
      highMassAmplitudeOptic: highMassAmplitudeOptic,
      omegaAcoustic: omegaAcoustic,
      lowMassAmplitudeAcoustic: lowMassAmplitudeAcoustic,
      highMassAmplitudeAcoustic: highMassAmplitudeAcoustic
    }
  }


  // Runs the animation of the moving "atoms"
  ns.startAnimation = function(two,board) {
    var initSeconds = new Date().getTime() / 1000 //Time when animation starts

    two.bind('update', frameCount => {
      var t = new Date().getTime() / 1000 - initSeconds //Time elapsed in seconds
      var a = this.params.latticeParameter,
          m1 = this.params.largeMass, //Large mass
          m2 = this.params.smallMass,//Small mass
          q = this.params.waveNumber //Wavenumber in 1/pixel units

      var dispersion = ns.dispersion(m1,m2,a,q) //Get the frequencie and amplitudes

      for ( var i = 0; i < this.params.nCircles; i++ ) {

        //Calculate the displacement of each circle using x = A*sin(q*x_0 - w*t)
        if ( i % 2 == 0 ) {
          var opticDisplacement = dispersion.lowMassAmplitudeOptic * Math.sin(q*this.opticalCircles.circles[i].equilibrium - dispersion.omegaOptic*t),
              acousticDisplacement = dispersion.lowMassAmplitudeAcoustic * Math.sin(q*this.opticalCircles.circles[i].equilibrium - dispersion.omegaAcoustic*t)
        }
        else {
          var opticDisplacement = dispersion.highMassAmplitudeOptic * Math.sin(q*this.opticalCircles.circles[i].equilibrium - dispersion.omegaOptic*t),
              acousticDisplacement = dispersion.highMassAmplitudeAcoustic * Math.sin(q*this.opticalCircles.circles[i].equilibrium - dispersion.omegaAcoustic*t)
        }

        //Set the displacement of each circle from the above
        this.opticalCircles.circles[i].translation.set( this.opticalCircles.circles[i].equilibrium + opticDisplacement , two.height / 2 )
        this.acousticCircles.circles[i].translation.set( this.acousticCircles.circles[i].equilibrium + acousticDisplacement , two.height / 2 )
      }
    }).play() //Calls this at 60fps
  }

  // Calls the animation after the parameters have been changed by an event
  ns.updateAnimation = function(firstTwo,secondTwo) {
    ns.startAnimation(firstTwo)
    ns.startAnimation(secondTwo)
  }

  //Function to draw the dispersion curve and the original points on the relevant div
  ns.drawGraph = function(elem) {
    var a = this.params.latticeParameter,
        m1 = this.params.largeMass, //Large mass
        m2 = this.params.smallMass //Small mass

    //Define the top left and bottom right of the grid.
    //We want x from -pi/a -> +pi/a to span a Brillouin zone and y to just above the max value of the dispersion curve
    var leftBrillouinBoundary = -Math.PI / a,
        rightBrillouinBoundary = Math.PI / a,
        omegaMax = Math.sqrt(2 * (m1 + m2) / (m1*m2))
    var topLeft = {
      x: leftBrillouinBoundary*1.1,
      y: omegaMax * 1.1
    }
    var bottomRight = {
      x: rightBrillouinBoundary*1.1,
      y: -omegaMax * 0.2
    }

    // Plot the two curves on a board drawn in the element given by elem
    this.board = JXG.JSXGraph.initBoard(elem.id, {boundingbox: [topLeft.x, topLeft.y, bottomRight.x, bottomRight.y]})

    // Create and label the x-axis
    var xAxis = this.board.xAxis = this.board.create('axis', [[0,0],[1,0]],
                {name: 'k', withLabel: true,
                label: {
                        position: 'rt', offset: [-3,12]
                      }
                })

    // Add ticks and labels to x-axis
    this.board.xAxis.newTicks = this.board.create('ticks', [xAxis, [leftBrillouinBoundary, 0, rightBrillouinBoundary]], {drawLabels: true,
                      label: {offset:[-10,-15]},
                      scale: rightBrillouinBoundary, scaleSymbol: 'pi/a'
                    })
    xAxis.removeTicks(xAxis.defaultTicks) // Remove numerical defaults

    // Create and label the y-axis
    var yAxis = this.board.yAxis = this.board.create('axis', [[0,0],[0,1]],
                {name: 'w', withLabel: true,
                 label: {position: 'rt', offset: [-20,0]}
               })
    yAxis.removeTicks(yAxis.defaultTicks)

    // Plot the dispersion
    this.board.create('functiongraph',[function(q){
      var dispersion = ns.dispersion(m1,m2,a,q)
      return dispersion.omegaOptic
    }])
    this.board.create('functiongraph',[function(q){
      var dispersion = ns.dispersion(m1,m2,a,q)
      return dispersion.omegaAcoustic
    }])

    // Plot the initial points
    var q = this.params.waveNumber,
        dispersion = ns.dispersion(m1,m2,a,q)

    return {
      upperPoint: this.board.create('point', [q, dispersion.omegaOptic], {name:'', withLabel:false}),
      lowerPoint: this.board.create('point', [q, dispersion.omegaAcoustic], {name:'', withLabel:false})
    }
  }

  // Function taken from the JXG documentation to get the coordinates of a click on the JXG board
  ns.getMouseCoords = function(e, i) {
    var cPos = this.board.getCoordsTopLeftCorner(e, i),
        absPos = JXG.getPosition(e, i),
        dx = absPos[0]-cPos[0],
        dy = absPos[1]-cPos[1]

    return {
      JXGCoords: new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], this.board),
      board: this.board
    }
  }

  /* Called in ns.runApp when the grid is clicked.
  1) Gets the coordinates of the click
  2) Sets the value of the wavenumber in the lib/ns.runApp object to the value clicked through params
  3) Removes old points and draws and returns new ones */
  ns.plotPoints = function(e) {

    // 1)
    var i

    if (e[JXG.touchProperty]) {
            // index of the finger that is used to extract the coordinates
            i = 0
        }

    var coordsAndBoard = ns.getMouseCoords(e, i),
        coords = coordsAndBoard.JXGCoords,
        board = coordsAndBoard.board

    // 2)
    var q = this.params.waveNumber = coords.usrCoords[1]
    var dispersion = ns.dispersion(this.params.largeMass, this.params.smallMass, this.params.latticeParameter, q)

    // 3)
    board.removeObject(this.points.upperPoint)
    board.removeObject(this.points.lowerPoint)

    this.points.upperPoint = board.create('point', [q, dispersion.omegaOptic], {name:'', withLabel:false}),
    this.points.lowerPoint = board.create('point', [q, dispersion.omegaAcoustic], {name:'', withLabel:false})
  }

  /* Adds a reciprocal lattice vector (RLV), called on a click of the + button from ns.runApp
  1) Adds the RLV to the wavenumber from lib/ns.runApp
  2) Removes old points and fixes ticks
  3) Pans the graph accross by a RLV
  4) Draws and returns the new points */
  ns.addReciprocalLatticeVector = function() {
    // 1)
    var reciprocalLatticeVector = 2*Math.PI / this.params.latticeParameter
    var q = this.params.waveNumber += reciprocalLatticeVector

    // 2)
    this.board.removeObject(this.points.upperPoint)
    this.board.removeObject(this.points.lowerPoint)

    var upperTick = Math.ceil( 2* q / reciprocalLatticeVector ) * reciprocalLatticeVector / 2,
        middleTick = upperTick - reciprocalLatticeVector / 2,
        lowerTick = middleTick - reciprocalLatticeVector / 2

    var xAxis = this.board.xAxis
    xAxis.removeTicks(xAxis.newTicks)
    xAxis.newTicks = this.board.create('ticks', [xAxis, [lowerTick, middleTick, upperTick]], {drawLabels: true,
                      label: {offset:[-10,-15]},
                      scale: reciprocalLatticeVector/2, scaleSymbol: 'pi/a'
                    })

    // 3)
    var boundingBox = this.board.getBoundingBox()
    for (var i = 0; i <=2; i+=2) {
      boundingBox[i] += reciprocalLatticeVector
    }
    this.board.setBoundingBox(boundingBox)

    // 4)
    var dispersion = ns.dispersion(this.params.largeMass,this.params.smallMass,this.params.latticeParameter,q)

    this.points.upperPoint = this.board.create('point', [q, dispersion.omegaOptic], {name:'', withLabel:false}),
    this.points.lowerPoint = this.board.create('point', [q, dispersion.omegaAcoustic], {name:'', withLabel:false})
  }

  // Same as above but subtraction
  ns.subtractReciprocalLatticeVector = function() {

    var reciprocalLatticeVector = 2*Math.PI / this.params.latticeParameter
    var q = this.params.waveNumber -= reciprocalLatticeVector

    this.board.removeObject(this.points.upperPoint)
    this.board.removeObject(this.points.lowerPoint)

    var upperTick = Math.ceil( 2 * q / reciprocalLatticeVector ) * reciprocalLatticeVector / 2,
        middleTick = upperTick - reciprocalLatticeVector / 2,
        lowerTick = middleTick - reciprocalLatticeVector / 2

    var xAxis = this.board.xAxis
    xAxis.removeTicks(this.board.xAxis.newTicks)
    xAxis.newTicks = this.board.create('ticks', [xAxis, [lowerTick, middleTick, upperTick]], {drawLabels: true,
                      label: {offset:[-10,-15]},
                      scale: reciprocalLatticeVector/2, scaleSymbol: 'pi/a'
                    })

    var boundingBox = this.board.getBoundingBox()
    for (var i = 0; i <= 2; i+= 2) {
      boundingBox[i] -= reciprocalLatticeVector
    }
    this.board.setBoundingBox(boundingBox)

    var dispersion = ns.dispersion(this.params.largeMass,this.params.smallMass,this.params.latticeParameter,q)

    this.points.upperPoint = this.board.create('point', [q, dispersion.omegaOptic], {name:'', withLabel:false}),
    this.points.lowerPoint = this.board.create('point', [q, dispersion.omegaAcoustic], {name:'', withLabel:false})
  }

  //Main function called from app.js
  ns.runApp = function(divs) {

    // Two instance for the optical atom animation
    var twoOptical = new Two({
      width: divs.opticalTwoContainer.offsetWidth,
      height: divs.opticalTwoContainer.offsetHeight / 2,
      type: Two.Types.canvas
    }).appendTo(divs.opticalTwoContainer)

    // Two instance for the acoustic atom animation
    var twoAcoustic = new Two({
      width: divs.acousticTwoContainer.offsetWidth,
      height: divs.acousticTwoContainer.offsetHeight / 2,
      type: Two.Types.canvas
    }).appendTo(divs.acousticTwoContainer)

    // Necessary params for animation
    this.params = {
      nCircles: 7, //Number of circles animated on each instance
      smallMass: 1,
      largeMass: 2
    }

    // Draw the circles and store their properties
    this.opticalCircles = ns.drawCircles(twoOptical)
    this.acousticCircles = ns.drawCircles(twoAcoustic)

    // Draw the dispersion curve on the "dispersionPlot" div and store initial points, sets this.board
    this.points = ns.drawGraph(divs.dispersionPlot)

    // Start the animations
    ns.startAnimation(twoOptical)
    ns.startAnimation(twoAcoustic)

    // When the grid is clicked, change the value of wavenumber, plot points and update the animations
    divs.dispersionPlot.addEventListener('mousedown',  function(e) {
      ns.plotPoints(e)
      ns.updateAnimation(twoOptical,twoAcoustic)
    })

    // Event handler for + button
    document.getElementById('addButton').addEventListener('click', function () {
      ns.addReciprocalLatticeVector()
      ns.updateAnimation(twoOptical,twoAcoustic)
    })

    // Event handler for - button
    document.getElementById('subtractButton').addEventListener('click', function () {
      ns.subtractReciprocalLatticeVector()
      ns.updateAnimation(twoOptical,twoAcoustic)
    })

  }
})(lib)
