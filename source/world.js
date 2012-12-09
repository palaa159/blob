/**
 * A world is responsible for keeping track of all points and constraints in a system. It is also
 * in charge of moving the system ahead at every step.
 */
var World = function(){
    this.gravity = vec2.createFrom(0, 0);

    this.points_ = [];
    this.constraints_ = [];

    this.setSize();
};

World.prototype = {
    /**
     * The width of the system in meters.
     *
     * @type {number}
     */
    width: null,

    /**
     * The height of the system in meters.
     *
     * @type {number}
     */
    height: null,

    /**
     * The gravity vector that should be applied to all interactive points.
     *
     * @type {vec2}
     */
    gravity: null,

    /**
     * An array that contains all of the points in the system.
     *
     * @type {Point[]}
     * @private
     */
    points_: null,

    /**
     * An array that contains all of the constraints in the system.
     *
     * @type {Constraint[]}
     * @private
     */
    constraints_: null,

    /**
     * A vector that can be used to scale from world coordinates back to pixels.
     *
     * @type {vec2}
     * @private
     */
    scale_: null,

    /**
     * The scale factor of the largest edge from world coordinates back to pixels.
     *
     * @type {number}
     * @private
     */
    maxScale_: null,

    /**
     * Sets the size of the system to fit maximally inside of the window.
     */
    setSize: function(){
        var innerWidth = window.innerWidth;
        var innerHeight = window.innerHeight;

        if (innerWidth > innerHeight){
            this.width = World.MIN_DIMENSION * (innerWidth / innerHeight);
            this.height = World.MIN_DIMENSION;

            this.maxScale_ = innerWidth / this.width;
        } else {
            this.width = World.MIN_DIMENSION;
            this.height = World.MIN_DIMENSION * (innerHeight / innerWidth);

            this.maxScale_ = innerHeight / this.height;
        }

        this.scale_ = vec2.createFrom(innerWidth / this.width, innerHeight / this.height);
    },

    /**
     * Adds a point to the system.
     *
     * @param {object} options An object literal to be passed to the Point constructor. See the
     *     Point class for details.
     */
    addPoint: function(options){
        options.world = this;
        var point = new Point(options);
        this.points_.push(point);
        return point;
    },

    /**
     * Adds a constraint to the system.
     *
     * @param {object} options An object literal to be passed to the Constraint constructor. See the
     *     Constraint class for details.
     */
    addConstraint: function(options){
        options.world = this;
        var constraint = new Constraint(options);
        this.constraints_.push(constraint);
        return constraint;
    },

    /**
     * Adjusts the provided point to account for collisions with the edges of the system as well as
     * collisions with other points. This method will be called by each interactive point when it
     * updates during it's move phase.
     *
     * @param {Point} point The point that should interact with its surroundings.
     */
    interact: function(point){
        var i, l, point2;

        for (i = 0, l = this.points_.length; i < l; i++){
            point2 = this.points_[i];
            if (point !== point2 && point2.interactive){
                this.collidePoints_(point, point2);
            }
        }

        // Collide with the edges of the system.
        var current = point.current;
        var r = point.radius;
        var x = current[0];
        var y = current[1];

        // If either of the height or width are outside of the bounds, just move it back in.
        current[0] = (x < r) ? r : (x > this.width - r) ? this.width - r : x;
        current[1] = (y < r) ? r : (y > this.height - r) ? this.height - r : y;
    },

    /**
     * Move the system forward one step in time by satisfying all of the constraints and moving the
     * points.
     */
    step: function(){
        var i, l;

        for (i = 0, l = this.constraints_.length; i < l; i++)
            this.constraints_[i].satisfy(World.DT);

        for (i = 0, l = this.points_.length; i < l; i++)
            this.points_[i].move(World.DT);
    },

    /**
     * Calls to each constraint and point in the system to draw itself.
     * @param {CanvasRenderingContext2D} context The context to be drawn into.
     */
    draw: function(context){
        for (i = 0, l = this.constraints_.length; i < l; i++)
            this.constraints_[i].draw(context);

        for (i = 0, l = this.points_.length; i < l; i++)
            this.points_[i].draw(context);
    },

    /**
     * Converts a points current location from world coordinates to
     *
     * @param {Point} point The point to be converted.
     *
     * @return {vec2} The point's current position converted to pixels.
     */
    pointToPixels: function(point){
        return vec2.multiply(point.current, this.scale_, vec2.create());
    },

    /**
     * Converts a single value (usually constants) from world coordinates to pixels.
     *
     * @param {number} value The value to be converted.
     *
     * @return {number} The value converted to pixels.
     */
    valueToPixels: function(value){
        return value * this.maxScale_;
    },

    /**
     * Detects if two points are currently overlapping and adjusts them so they are not.
     *
     * @param {Point} point1
     * @param {Point} point2
     * @private
     */
    collidePoints_: function(point1, point2){
        var between = vec2.subtract(point1.current, point2.current, vec2.create());
        var distance = vec2.length(between) - point1.radius - point2.radius;

        if (distance >= 0) return;

        var direction = vec2.normalize(between, vec2.create());
        var adjustment = vec2.scale(direction, -distance/2, vec2.create());

        vec2.add(point1.current, adjustment, point1.current);
        vec2.subtract(point2.current, adjustment, point2.current);
    }
};

/**
 * The time (in ms) to move the system ahead at every step.
 *
 * @type {number}
 * @static
 */
World.DT = 16;

/**
 * The minimum dimension to be used by the system.
 *
 * @type {number}
 * @static
 */
World.MIN_DIMENSION = 10;