(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var ENGINE = require("./engine").ENGINE;

var Ship = require("./ship").Ship;

var LaserCollection = require("./laserCollection").LaserCollection;

var AsteroidCollection = require("./asteroidCollection").AsteroidCollection;

(function () {
    "use strict";

    // Enums
    var GAME_STATE = {
        START: "START",
        PLAY: "PLAY",
        PAUSE: "PAUSE",
        OVER: "OVER"
    };

    // Game Globals
    var gameScore = 0;
    var gameLives = 3;
    var canvas = document.getElementById("GameCanvas");
    var ctx = canvas.getContext("2d");
    var gameState = GAME_STATE.START;

    //region Game
    var playerShip = new Ship({
        lasers: new LaserCollection()
    });

    var asteroids = new AsteroidCollection();

    var checkShipAndAsteroidCollision = function checkShipAndAsteroidCollision() {
        asteroids.list.forEach(_checkShipCollision);

        function _checkShipCollision(asteroid, index) {
            if (ENGINE.util.checkCollision(playerShip, asteroid)) {
                asteroids.list.splice(index, 1);
                removeLife();
            }
        }
    };

    var checkShipLaserAndAsteroidCollision = function checkShipLaserAndAsteroidCollision() {
        var checkLaserCollision = function checkLaserCollision(laser, laserIndex) {
            // For every asteroid
            for (var i = 0; i < asteroids.list.length; i++) {
                if (ENGINE.util.checkCollision(laser, asteroids.list[i])) {
                    playerShip.lasers.list.splice(laserIndex, 1);
                    asteroids.list.splice(i, 1);
                    addScore();
                    return 0;
                }
            }
        };

        playerShip.lasers.list.forEach(checkLaserCollision);
    };

    var init = function init() {
        scaleScreen();
        touchSetup();
    };

    var game = ENGINE.factory.createGame({
        init: (function (_init) {
            var _initWrapper = function init() {
                return _init.apply(this, arguments);
            };

            _initWrapper.toString = function () {
                return _init.toString();
            };

            return _initWrapper;
        })(function () {
            init();
        }),
        update: function update() {
            if (gameState === GAME_STATE.START) {
                return;
            } else if (gameState === GAME_STATE.PLAY) {
                asteroids.update();
                playerShip.update();
                checkShipAndAsteroidCollision();
                checkShipLaserAndAsteroidCollision();
            } else if (gameState === GAME_STATE.PAUSE) {
                return;
            } else if (gameState === GAME_STATE.OVER) {
                return;
            }
        },
        draw: function draw() {
            ctx.clearRect(0, 0, ENGINE.settings.canvasWidth, ENGINE.settings.canvasHeight);
            drawScore();
            drawLives();

            if (gameState === GAME_STATE.START) {
                drawStartScreen();
            } else if (gameState === GAME_STATE.PLAY) {
                playerShip.draw(ctx);
                asteroids.draw(ctx);
            } else if (gameState === GAME_STATE.PAUSE) {
                console.log("Paused");
            } else if (gameState === GAME_STATE.OVER) {
                endGame();
            } else {
                drawStartScreen();
            }
        }
    });

    game.start();

    setInterval(function () {
        if (gameState === GAME_STATE.PLAY) {
            asteroids.addAsteroid();
        }
    }, 140 - ENGINE.settings.canvasWidth / 100);
    //endregion

    //region Touch Game Controls
    function touchSetup() {
        var touchable = ("createTouch" in document);

        if (touchable) {
            canvas.addEventListener("touchstart", onTouchStart, false);
            canvas.addEventListener("touchmove", onTouchMove, false);
            canvas.addEventListener("touchend", onTouchEnd, false);
        }
    }

    function onTouchStart(event) {
        console.log("touchstart");

        if (gameState === GAME_STATE.START || gameState === GAME_STATE.OVER) {
            startNewGame();
        } else {
            if (event.touches[0].clientX > ENGINE.settings.canvasWidth / 2) {
                playerShip.fire();
            }
        }
    }

    function onTouchMove(event) {
        // Prevent the browser from doing its default thing (scroll, zoom)
        event.preventDefault();
        console.log("touchmove");
    }

    function onTouchEnd() {
        //do stuff
        console.log("touchend");
    }
    //endregion

    //region Key Game Controls
    ENGINE.controls.on("left", function () {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveLeft();
        }
    });

    ENGINE.controls.on("right", function () {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveRight();
        }
    });

    ENGINE.controls.on("up", function () {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveUp();
        }
    });

    ENGINE.controls.on("down", function () {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.moveDown();
        }
    });

    ENGINE.controls.onkey("space", function () {
        if (gameState === GAME_STATE.PLAY) {
            playerShip.fire();
        }
    });

    ENGINE.controls.onkey("pause", function () {
        pauseGame();
    });

    ENGINE.controls.onkey("enter", function () {
        if (gameState === GAME_STATE.START || gameState === GAME_STATE.OVER) {
            startNewGame();
        }
    });
    //endregion

    //region Helper Functions
    function drawStartScreen() {
        $(".js-start-screen").show();
    }

    function hideStartScreen() {
        $(".js-start-screen").hide();
    }

    function startNewGame() {
        gameLives = 3;
        gameState = GAME_STATE.PLAY;
        gameScore = 0;
        hideStartScreen();
        $(".js-game-over-screen").hide();
    }

    function pauseGame() {
        drawPauseScreen();

        if (gameState === GAME_STATE.PLAY) {
            gameState = GAME_STATE.PAUSE;
        } else {
            gameState = GAME_STATE.PLAY;
        }
    }

    function drawPauseScreen() {
        $(".js-pause-screen").toggle();
    }

    function endGame() {
        $(".js-game-over-screen").show();
    }

    function addScore() {
        gameScore += 1;
    }

    function drawScore() {
        $(".js-score").html("Score:" + gameScore);
    }

    function removeLife() {
        if (gameLives > 0) {
            gameLives -= 1;
        } else {
            gameState = GAME_STATE.OVER;
        }
    }

    function drawLives() {
        $(".js-lives").html("Lives:" + gameLives);
    }

    function scaleScreen() {
        if (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) < 720) {
            ENGINE.settings.canvasWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            ENGINE.settings.canvasHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            ctx.canvas.width = ENGINE.settings.canvasWidth;
            ctx.canvas.height = ENGINE.settings.canvasHeight;

            $(".notifications").removeClass("large-screen");
            //$('#GameCanvas').width(ENGINE.settings.canvasWidth);
            //$('#GameCanvas').height(ENGINE.settings.canvasHeight);
        }
    }
    //endregion
})();

},{"./asteroidCollection":3,"./engine":4,"./laserCollection":6,"./ship":7}],2:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ENGINE = require("./engine").ENGINE;

var Asteroid = (function () {
    function Asteroid() {
        _classCallCheck(this, Asteroid);

        var range = ENGINE.util.getRandomNumber(30, 100);

        this.settings = {
            width: range,
            height: range,
            speed: ENGINE.util.getRandomNumber(2, 6)
        };

        this.settings.posX = ENGINE.util.getRandomNumber(0 - this.settings.height, ENGINE.settings.canvasWidth);
        this.settings.posY = this.settings.height * -2;

        this.img = new Image();
        this.img.src = "App/Content/Images/asteroid-" + ENGINE.util.getRandomNumber(1, 4) + ".png";
    }

    _prototypeProperties(Asteroid, null, {
        draw: {
            value: function draw(context) {
                context.drawImage(this.img, this.settings.posX, this.settings.posY, this.settings.width, this.settings.height);
            },
            writable: true,
            configurable: true
        },
        update: {
            value: function update() {
                this.settings.posY += this.settings.speed;
            },
            writable: true,
            configurable: true
        }
    });

    return Asteroid;
})();

exports.Asteroid = Asteroid;
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{"./engine":4}],3:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ENGINE = require("./engine").ENGINE;

var Asteroid = require("./asteroid").Asteroid;

var AsteroidCollection = (function () {
    function AsteroidCollection() {
        _classCallCheck(this, AsteroidCollection);

        this.list = [];
    }

    _prototypeProperties(AsteroidCollection, null, {
        update: {
            value: function update() {
                var checkAsteroidBounds = (function (asteroid, index) {
                    if (asteroid.settings.posY > ENGINE.settings.canvasHeight + 30) {
                        this.list.splice(index, 1);
                    }
                }).bind(this);

                var update = function update(asteroid) {
                    asteroid.update();
                };

                this.list.forEach(checkAsteroidBounds);
                this.list.forEach(update);
            },
            writable: true,
            configurable: true
        },
        draw: {
            value: function draw(context) {
                var draw = function draw(asteroid) {
                    asteroid.draw(context);
                };

                this.list.forEach(draw);
            },
            writable: true,
            configurable: true
        },
        addAsteroid: {
            value: function addAsteroid() {
                this.list.push(new Asteroid());
            },
            writable: true,
            configurable: true
        }
    });

    return AsteroidCollection;
})();

exports.AsteroidCollection = AsteroidCollection;
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{"./asteroid":2,"./engine":4}],4:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ENGINE = (function () {
    // Temp until we get a module system in place (Convert to a ES6 module)
    "use strict";

    var factory = (function () {
        var Game = (function () {
            function Game(properties) {
                _classCallCheck(this, Game);

                this._update = properties.update;
                this._draw = properties.draw;
                this._init = properties.init;
            }

            _prototypeProperties(Game, null, {
                update: {
                    value: function update() {
                        this._update();
                    },
                    writable: true,
                    configurable: true
                },
                draw: {
                    value: function draw() {
                        this._draw();
                    },
                    writable: true,
                    configurable: true
                },
                start: {
                    value: function start() {
                        this._init();
                        var gameLoop = (function () {
                            this._update();
                            this._draw();
                            requestAnimationFrame(gameLoop);
                        }).bind(this);

                        requestAnimationFrame(gameLoop);
                    },
                    writable: true,
                    configurable: true
                }
            });

            return Game;
        })();

        var GameObject = function GameObject() {
            _classCallCheck(this, GameObject);

            this.settings = {
                color: "#000000",
                width: 50,
                height: 50,
                posX: 0,
                posY: 0
            };
        };

        function createGame(update, draw) {
            return new Game(update, draw);
        }

        function createGameObject() {
            return new GameObject();
        }

        return {
            createGame: createGame,
            createGameObject: createGameObject
        };
    })();

    var controls = (function () {
        var eventActions = {};
        var keyState = {};
        var keyAction = {
            space: function space() {
                console.log("Key action space not defined");
            },
            pause: function pause() {
                console.log("Key action pause not defined");
            },
            enter: function enter() {
                console.log("Key action enter not defined");
            }
        };

        var on = function on(event, func) {
            switch (event) {
                case "left":
                    eventActions.left = func;
                    break;
                case "right":
                    eventActions.right = func;
                    break;
                case "up":
                    eventActions.up = func;
                    break;
                case "down":
                    eventActions.down = func;
                    break;
                case "space":
                    eventActions.down = func;
                    break;
                case "pause":
                    eventActions.down = func;
                    break;
                default:
                    console.log("unknown control event fired");
            }
        };

        var onkey = function onkey(event, func) {
            switch (event) {
                case "space":
                    keyAction.space = func;
                    break;
                case "pause":
                    keyAction.pause = func;
                    break;
                case "enter":
                    keyAction.enter = func;
                    break;
                default:
                    console.log("unknown control event fired");
            }
        };

        var controlsLoop = (function (_controlsLoop) {
            var _controlsLoopWrapper = function controlsLoop() {
                return _controlsLoop.apply(this, arguments);
            };

            _controlsLoopWrapper.toString = function () {
                return _controlsLoop.toString();
            };

            return _controlsLoopWrapper;
        })(function () {
            // (Up Arrow)
            if (keyState[38] || keyState[87]) {
                eventActions.up();
            }

            // (Left Arrow)
            if (keyState[37] || keyState[65]) {
                eventActions.left();
            }

            // (Right Arrow)
            if (keyState[39] || keyState[68]) {
                eventActions.right();
            }

            // (Down Arrow)
            if (keyState[40] || keyState[83]) {
                eventActions.down();
            }

            requestAnimationFrame(controlsLoop);
        });

        requestAnimationFrame(controlsLoop);

        window.addEventListener("keydown", function (e) {
            keyState[e.keyCode || e.which] = true;
        }, true);

        window.addEventListener("keyup", function (e) {
            keyState[e.keyCode || e.which] = false;
        }, true);

        $(document).keydown(function (e) {
            // Enter key
            if (e.keyCode === 13) {
                keyAction.enter();
            }

            // (p) Pause
            if (e.keyCode === 80) {
                keyAction.pause();
            }

            // Space bar
            if (e.keyCode === 32) {
                keyAction.space();
            }
        });

        return {
            on: on,
            onkey: onkey
        };
    })();

    var util = (function () {
        function _horizontalCollision(obj1, obj2) {
            var obj1RightSide = obj1.settings.posX + obj1.settings.width;
            var obj1LeftSide = obj1.settings.posX;
            var obj2RightSide = obj2.settings.posX + obj2.settings.width;
            var obj2LeftSide = obj2.settings.posX;

            if (leftSideCollision() || rightSideCollision()) {
                return true;
            } else {
                return false;
            }

            function leftSideCollision() {
                if (obj1LeftSide >= obj2LeftSide && obj1LeftSide <= obj2RightSide) {
                    return true;
                } else {
                    return false;
                }
            }

            function rightSideCollision() {
                if (obj1RightSide >= obj2LeftSide && obj1RightSide <= obj2RightSide) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        function _verticalPosition(obj1, obj2) {
            if (checkTopSideCollision()) {
                return true;
            } else {
                return false;
            }

            function checkTopSideCollision() {
                return obj1.settings.posY >= obj2.settings.posY && obj1.settings.posY <= obj2.settings.posY + obj2.settings.height;
            }
        }

        function checkCollision(obj1, obj2) {
            if (_horizontalCollision(obj1, obj2) && _verticalPosition(obj1, obj2)) {
                return true;
            } else {
                return false;
            }
        }

        function getRandomNumber(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function getRandomColor() {
            var letters = "0123456789ABCDEF".split("");
            var color = "#";

            for (var i = 0; i < 6; i++) {
                color += letters[Math.round(Math.random() * 15)];
            }

            return color;
        }

        return {
            checkCollision: checkCollision,
            getRandomNumber: getRandomNumber,
            getRandomColor: getRandomColor
        };
    })();

    var settings = {
        canvasWidth: 720,
        canvasHeight: 480
    };

    return {
        util: util,
        factory: factory,
        controls: controls,
        settings: settings
    };
})();

exports.ENGINE = ENGINE;
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{}],5:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Laser = (function () {
    function Laser(originX, originY) {
        _classCallCheck(this, Laser);

        this.settings = {
            posX: originX,
            posY: originY,
            width: 4.5,
            height: 25
        };

        this.sound = new window.Howl({
            urls: ["App/Content/Audio/laser.mp3"]
        });
    }

    _prototypeProperties(Laser, null, {
        draw: {
            value: function draw(context) {
                context.beginPath();
                context.fillStyle = "#00ff00"; //ENGINE.util.getRandomColor();
                context.arc(this.settings.posX, this.settings.posY, this.settings.width, this.settings.height, Math.PI * 2, true);
                context.fill();
                context.closePath();
            },
            writable: true,
            configurable: true
        },
        update: {
            value: function update() {
                this.settings.posY -= 5.05;
            },
            writable: true,
            configurable: true
        },
        playSound: {
            value: function playSound() {
                this.sound.play();
            },
            writable: true,
            configurable: true
        }
    });

    return Laser;
})();

exports.Laser = Laser;
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{}],6:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Laser = require("./laser").Laser;

var LaserCollection = (function () {
    function LaserCollection() {
        _classCallCheck(this, LaserCollection);

        this.maxLasers = 10;
        this.list = [];
    }

    _prototypeProperties(LaserCollection, null, {
        update: {
            value: function update() {
                var updateLaser = (function (laser, index) {
                    this.list[index].update();
                }).bind(this);

                var checkLaserBounds = (function (laser, index) {
                    if (this.list[index].settings.posY < -5) {
                        this.list.shift(); // If laser outside of top bounds remove from array
                    }
                }).bind(this);

                this.list.forEach(checkLaserBounds);
                this.list.forEach(updateLaser);
            },
            writable: true,
            configurable: true
        },
        draw: {
            value: function draw(context) {
                var draw = function draw(laser) {
                    laser.draw(context);
                };

                this.list.forEach(draw);
            },
            writable: true,
            configurable: true
        },
        fire: {
            value: function fire(posX, posY) {
                if (this.list.length < this.maxLasers) {
                    var laser = new Laser(posX, posY);
                    laser.playSound();
                    this.list.push(laser);
                }
            },
            writable: true,
            configurable: true
        }
    });

    return LaserCollection;
})();

exports.LaserCollection = LaserCollection;
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{"./laser":5}],7:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ENGINE = require("./engine").ENGINE;

var Ship = (function () {
    function Ship(properties) {
        _classCallCheck(this, Ship);

        this.lasers = properties.lasers;

        this.settings = {
            color: "rgba(0, 0, 0, 1)",
            posX: 25,
            posY: 350,
            height: 25,
            width: 25,
            speed: 4
        };

        this.img = new Image();
        this.img.src = "App/Content/Images/spaceship.png";
    }

    _prototypeProperties(Ship, null, {
        draw: {
            value: function draw(context) {
                context.drawImage(this.img, this.settings.posX, this.settings.posY);
                this.lasers.draw(context);
            },
            writable: true,
            configurable: true
        },
        update: {
            value: function update() {
                this.lasers.update();
            },
            writable: true,
            configurable: true
        },
        fire: {
            value: function fire() {
                this.lasers.fire(this.settings.posX + 23, this.settings.posY - 5);
            },
            writable: true,
            configurable: true
        },
        moveLeft: {
            value: function moveLeft() {
                if (this.settings.posX > 0) {
                    this.settings.posX = this.settings.posX - this.settings.speed;
                }
            },
            writable: true,
            configurable: true
        },
        moveRight: {
            value: function moveRight() {
                if (this.settings.posX + this.settings.width < ENGINE.settings.canvasWidth + 70) {
                    this.settings.posX = this.settings.posX + this.settings.speed;
                }
            },
            writable: true,
            configurable: true
        },
        moveUp: {
            value: function moveUp() {
                if (this.settings.posY > 0) {
                    this.settings.posY = this.settings.posY - this.settings.speed;
                }
            },
            writable: true,
            configurable: true
        },
        moveDown: {
            value: function moveDown() {
                if (this.settings.posY < ENGINE.settings.canvasHeight - 40) {
                    this.settings.posY = this.settings.posY + this.settings.speed;
                }
            },
            writable: true,
            configurable: true
        }
    });

    return Ship;
})();

exports.Ship = Ship;
Object.defineProperty(exports, "__esModule", {
    value: true
});

},{"./engine":4}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZDovR2l0SHViL3NwYWNlLXNob290ZXIvQXBwL0phdmFTY3JpcHQvU3JjL2FwcC5qcyIsImQ6L0dpdEh1Yi9zcGFjZS1zaG9vdGVyL0FwcC9KYXZhU2NyaXB0L1NyYy9hc3Rlcm9pZC5qcyIsImQ6L0dpdEh1Yi9zcGFjZS1zaG9vdGVyL0FwcC9KYXZhU2NyaXB0L1NyYy9hc3Rlcm9pZENvbGxlY3Rpb24uanMiLCJkOi9HaXRIdWIvc3BhY2Utc2hvb3Rlci9BcHAvSmF2YVNjcmlwdC9TcmMvZW5naW5lLmpzIiwiZDovR2l0SHViL3NwYWNlLXNob290ZXIvQXBwL0phdmFTY3JpcHQvU3JjL2xhc2VyLmpzIiwiZDovR2l0SHViL3NwYWNlLXNob290ZXIvQXBwL0phdmFTY3JpcHQvU3JjL2xhc2VyQ29sbGVjdGlvbi5qcyIsImQ6L0dpdEh1Yi9zcGFjZS1zaG9vdGVyL0FwcC9KYXZhU2NyaXB0L1NyYy9zaGlwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7SUNBUyxNQUFNLFdBQU8sVUFBVSxFQUF2QixNQUFNOztJQUNQLElBQUksV0FBTyxRQUFRLEVBQW5CLElBQUk7O0lBQ0osZUFBZSxXQUFPLG1CQUFtQixFQUF6QyxlQUFlOztJQUNmLGtCQUFrQixXQUFPLHNCQUFzQixFQUEvQyxrQkFBa0I7O0FBRTFCLEFBQUMsQ0FBQSxZQUFXO0FBQ1IsZ0JBQVksQ0FBQzs7O0FBR2IsUUFBTSxVQUFVLEdBQUc7QUFDZixhQUFLLEVBQUUsT0FBTztBQUNkLFlBQUksRUFBRSxNQUFNO0FBQ1osYUFBSyxFQUFFLE9BQU87QUFDZCxZQUFJLEVBQUUsTUFBTTtLQUNmLENBQUM7OztBQUdGLFFBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNsQixRQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDbEIsUUFBSSxNQUFNLEdBQUcsUUFBUSxD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QkFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7aUJBQ2pFO2FBQ0o7Ozs7OztXQXBEQyxJQUFJOzs7UUF1REYsSUFBSSxHQUFKLElBQUkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwi77u/aW1wb3J0IHtFTkdJTkV9IGZyb20gJy4vZW5naW5lJztcclxuaW1wb3J0IHtTaGlwfSBmcm9tICcuL3NoaXAnO1xyXG5pbXBvcnQge0xhc2VyQ29sbGVjdGlvbn0gZnJvbSAnLi9sYXNlckNvbGxlY3Rpb24nO1xyXG5pbXBvcnQge0FzdGVyb2lkQ29sbGVjdGlvbn0gZnJvbSAnLi9hc3Rlcm9pZENvbGxlY3Rpb24nO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8vIEVudW1zXHJcbiAgICBjb25zdCBHQU1FX1NUQVRFID0ge1xyXG4gICAgICAgIFNUQVJUOiAnU1RBUlQnLFxyXG4gICAgICAgIFBMQVk6ICdQTEFZJyxcclxuICAgICAgICBQQVVTRTogJ1BBVVNFJyxcclxuICAgICAgICBPVkVSOiAnT1ZFUidcclxuICAgIH07XHJcblxyXG4gICAgLy8gR2FtZSBHbG9iYWxzXHJcbiAgICBsZXQgZ2FtZVNjb3JlID0gMDtcclxuICAgIGxldCBnYW1lTGl2ZXMgPSAzO1xyXG4gICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdHYW1lQ2FudmFzJyk7XHJcbiAgICBsZXQgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICBsZXQgZ2FtZVN0YXRlID0gR0FNRV9TVEFURS5TVEFSVDtcclxuXHJcbiAgICAvL3JlZ2lvbiBHYW1lXHJcbiAgICBsZXQgcGxheWVyU2hpcCA9IG5ldyBTaGlwKHtcclxuICAgICAgICBsYXNlcnM6IG5ldyBMYXNlckNvbGxlY3Rpb24oKVxyXG4gICAgfSk7XHJcblxyXG4gICAgbGV0IGFzdGVyb2lkcyA9IG5ldyBBc3Rlcm9pZENvbGxlY3Rpb24oKTtcclxuXHJcbiAgICBsZXQgY2hlY2tTaGlwQW5kQXN0ZXJvaWRDb2xsaXNpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBhc3Rlcm9pZHMubGlzdC5mb3JFYWNoKF9jaGVja1NoaXBDb2xsaXNpb24pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBfY2hlY2tTaGlwQ29sbGlzaW9uKGFzdGVyb2lkLCBpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoRU5HSU5FLnV0aWwuY2hlY2tDb2xsaXNpb24ocGxheWVyU2hpcCwgYXN0ZXJvaWQpKSB7XHJcbiAgICAgICAgICAgICAgICBhc3Rlcm9pZHMubGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlTGlmZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgY2hlY2tTaGlwTGFzZXJBbmRBc3Rlcm9pZENvbGxpc2lvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxldCBjaGVja0xhc2VyQ29sbGlzaW9uID0gZnVuY3Rpb24obGFzZXIsIGxhc2VySW5kZXgpIHtcclxuICAgICAgICAgICAgLy8gRm9yIGV2ZXJ5IGFzdGVyb2lkXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXN0ZXJvaWRzLmxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChFTkdJTkUudXRpbC5jaGVja0NvbGxpc2lvbihsYXNlciwgYXN0ZXJvaWRzLmxpc3RbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyU2hpcC5sYXNlcnMubGlzdC5zcGxpY2UobGFzZXJJbmRleCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXN0ZXJvaWRzLmxpc3Quc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZFNjb3JlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBwbGF5ZXJTaGlwLmxhc2Vycy5saXN0LmZvckVhY2goY2hlY2tMYXNlckNvbGxpc2lvbik7XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBpbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2NhbGVTY3JlZW4oKTtcclxuICAgICAgICB0b3VjaFNldHVwKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBnYW1lID0gRU5HSU5FLmZhY3RvcnkuY3JlYXRlR2FtZSh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGluaXQoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuU1RBUlQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuUExBWSkge1xyXG4gICAgICAgICAgICAgICAgYXN0ZXJvaWRzLnVwZGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgcGxheWVyU2hpcC51cGRhdGUoKTtcclxuICAgICAgICAgICAgICAgIGNoZWNrU2hpcEFuZEFzdGVyb2lkQ29sbGlzaW9uKCk7XHJcbiAgICAgICAgICAgICAgICBjaGVja1NoaXBMYXNlckFuZEFzdGVyb2lkQ29sbGlzaW9uKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2FtZVN0YXRlID09PSBHQU1FX1NUQVRFLlBBVVNFKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2FtZVN0YXRlID09PSBHQU1FX1NUQVRFLk9WRVIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZHJhdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgRU5HSU5FLnNldHRpbmdzLmNhbnZhc1dpZHRoLCBFTkdJTkUuc2V0dGluZ3MuY2FudmFzSGVpZ2h0KTtcclxuICAgICAgICAgICAgZHJhd1Njb3JlKCk7XHJcbiAgICAgICAgICAgIGRyYXdMaXZlcygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5TVEFSVCkge1xyXG4gICAgICAgICAgICAgICAgZHJhd1N0YXJ0U2NyZWVuKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2FtZVN0YXRlID09PSBHQU1FX1NUQVRFLlBMQVkpIHtcclxuICAgICAgICAgICAgICAgIHBsYXllclNoaXAuZHJhdyhjdHgpO1xyXG4gICAgICAgICAgICAgICAgYXN0ZXJvaWRzLmRyYXcoY3R4KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuUEFVU0UpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQYXVzZWQnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuT1ZFUikge1xyXG4gICAgICAgICAgICAgICAgZW5kR2FtZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZHJhd1N0YXJ0U2NyZWVuKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBnYW1lLnN0YXJ0KCk7XHJcblxyXG4gICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5QTEFZKSB7XHJcbiAgICAgICAgICAgIGFzdGVyb2lkcy5hZGRBc3Rlcm9pZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDE0MCAtIChFTkdJTkUuc2V0dGluZ3MuY2FudmFzV2lkdGggLyAxMDApKTtcclxuICAgIC8vZW5kcmVnaW9uXHJcblxyXG4gICAgLy9yZWdpb24gVG91Y2ggR2FtZSBDb250cm9sc1xyXG4gICAgZnVuY3Rpb24gdG91Y2hTZXR1cCgpIHtcclxuICAgICAgICBsZXQgdG91Y2hhYmxlID0gJ2NyZWF0ZVRvdWNoJyBpbiBkb2N1bWVudDtcclxuXHJcbiAgICAgICAgaWYgKHRvdWNoYWJsZSkge1xyXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UgKTtcclxuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSApO1xyXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRvdWNoU3RhcnQoZXZlbnQpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygndG91Y2hzdGFydCcpO1xyXG5cclxuICAgICAgICBpZiAoZ2FtZVN0YXRlID09PSBHQU1FX1NUQVRFLlNUQVJUIHx8IGdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5PVkVSKSB7XHJcbiAgICAgICAgICAgIHN0YXJ0TmV3R2FtZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC50b3VjaGVzWzBdLmNsaWVudFggPiBFTkdJTkUuc2V0dGluZ3MuY2FudmFzV2lkdGggLyAyKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXJTaGlwLmZpcmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRvdWNoTW92ZShldmVudCkge1xyXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIGJyb3dzZXIgZnJvbSBkb2luZyBpdHMgZGVmYXVsdCB0aGluZyAoc2Nyb2xsLCB6b29tKVxyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RvdWNobW92ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XHJcbiAgICAgICAgLy9kbyBzdHVmZlxyXG4gICAgICAgIGNvbnNvbGUubG9nKCd0b3VjaGVuZCcpO1xyXG4gICAgfVxyXG4gICAgLy9lbmRyZWdpb25cclxuXHJcbiAgICAvL3JlZ2lvbiBLZXkgR2FtZSBDb250cm9sc1xyXG4gICAgRU5HSU5FLmNvbnRyb2xzLm9uKCdsZWZ0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5QTEFZKSB7XHJcbiAgICAgICAgICAgIHBsYXllclNoaXAubW92ZUxlZnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBFTkdJTkUuY29udHJvbHMub24oJ3JpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5QTEFZKSB7XHJcbiAgICAgICAgICAgIHBsYXllclNoaXAubW92ZVJpZ2h0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgRU5HSU5FLmNvbnRyb2xzLm9uKCd1cCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuUExBWSkge1xyXG4gICAgICAgICAgICBwbGF5ZXJTaGlwLm1vdmVVcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIEVOR0lORS5jb250cm9scy5vbignZG93bicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuUExBWSkge1xyXG4gICAgICAgICAgICBwbGF5ZXJTaGlwLm1vdmVEb3duKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgRU5HSU5FLmNvbnRyb2xzLm9ua2V5KCdzcGFjZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuUExBWSkge1xyXG4gICAgICAgICAgICBwbGF5ZXJTaGlwLmZpcmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBFTkdJTkUuY29udHJvbHMub25rZXkoJ3BhdXNlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcGF1c2VHYW1lKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBFTkdJTkUuY29udHJvbHMub25rZXkoJ2VudGVyJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5TVEFSVCB8fCBnYW1lU3RhdGUgPT09IEdBTUVfU1RBVEUuT1ZFUikge1xyXG4gICAgICAgICAgICBzdGFydE5ld0dhbWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vZW5kcmVnaW9uXHJcblxyXG4gICAgLy9yZWdpb24gSGVscGVyIEZ1bmN0aW9uc1xyXG4gICAgZnVuY3Rpb24gZHJhd1N0YXJ0U2NyZWVuKCkge1xyXG4gICAgICAgICQoJy5qcy1zdGFydC1zY3JlZW4nKS5zaG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGlkZVN0YXJ0U2NyZWVuKCkge1xyXG4gICAgICAgICQoJy5qcy1zdGFydC1zY3JlZW4nKS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3RhcnROZXdHYW1lKCkge1xyXG4gICAgICAgIGdhbWVMaXZlcyA9IDM7XHJcbiAgICAgICAgZ2FtZVN0YXRlID0gR0FNRV9TVEFURS5QTEFZO1xyXG4gICAgICAgIGdhbWVTY29yZSA9IDA7XHJcbiAgICAgICAgaGlkZVN0YXJ0U2NyZWVuKCk7XHJcbiAgICAgICAgJCgnLmpzLWdhbWUtb3Zlci1zY3JlZW4nKS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGF1c2VHYW1lKCkge1xyXG4gICAgICAgIGRyYXdQYXVzZVNjcmVlbigpO1xyXG5cclxuICAgICAgICBpZiAoZ2FtZVN0YXRlID09PSBHQU1FX1NUQVRFLlBMQVkpIHtcclxuICAgICAgICAgICAgZ2FtZVN0YXRlID0gR0FNRV9TVEFURS5QQVVTRTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnYW1lU3RhdGUgPSBHQU1FX1NUQVRFLlBMQVk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdQYXVzZVNjcmVlbigpIHtcclxuICAgICAgICAkKCcuanMtcGF1c2Utc2NyZWVuJykudG9nZ2xlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZW5kR2FtZSgpIHtcclxuICAgICAgICAkKCcuanMtZ2FtZS1vdmVyLXNjcmVlbicpLnNob3coKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGRTY29yZSgpIHtcclxuICAgICAgICBnYW1lU2NvcmUgKz0gMTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3U2NvcmUoKSB7XHJcbiAgICAgICAgJCgnLmpzLXNjb3JlJykuaHRtbCgnU2NvcmU6JyArIGdhbWVTY29yZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlmZSgpIHtcclxuICAgICAgICBpZiAoZ2FtZUxpdmVzID4gMCkge1xyXG4gICAgICAgICAgICBnYW1lTGl2ZXMgLT0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnYW1lU3RhdGUgPSBHQU1FX1NUQVRFLk9WRVI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdMaXZlcygpIHtcclxuICAgICAgICAkKCcuanMtbGl2ZXMnKS5odG1sKCdMaXZlczonICsgZ2FtZUxpdmVzKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzY2FsZVNjcmVlbigpIHtcclxuICAgICAgICBpZiAoTWF0aC5tYXgoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLCB3aW5kb3cuaW5uZXJXaWR0aCB8fCAwKSA8IDcyMCkge1xyXG4gICAgICAgICAgICBFTkdJTkUuc2V0dGluZ3MuY2FudmFzV2lkdGggPSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApO1xyXG4gICAgICAgICAgICBFTkdJTkUuc2V0dGluZ3MuY2FudmFzSGVpZ2h0ID0gTWF0aC5tYXgoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCwgd2luZG93LmlubmVySGVpZ2h0IHx8IDApO1xyXG4gICAgICAgICAgICBjdHguY2FudmFzLndpZHRoICA9IEVOR0lORS5zZXR0aW5ncy5jYW52YXNXaWR0aDtcclxuICAgICAgICAgICAgY3R4LmNhbnZhcy5oZWlnaHQgPSBFTkdJTkUuc2V0dGluZ3MuY2FudmFzSGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgJCgnLm5vdGlmaWNhdGlvbnMnKS5yZW1vdmVDbGFzcygnbGFyZ2Utc2NyZWVuJyk7XHJcbiAgICAgICAgICAgIC8vJCgnI0dhbWVDYW52YXMnKS53aWR0aChFTkdJTkUuc2V0dGluZ3MuY2FudmFzV2lkdGgpO1xyXG4gICAgICAgICAgICAvLyQoJyNHYW1lQ2FudmFzJykuaGVpZ2h0KEVOR0lORS5zZXR0aW5ncy5jYW52YXNIZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vZW5kcmVnaW9uXHJcbn0oKSk7XHJcbiIsImltcG9ydCB7RU5HSU5FfSBmcm9tICcuL2VuZ2luZSc7XHJcblxyXG5jbGFzcyBBc3Rlcm9pZCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBsZXQgcmFuZ2UgPSBFTkdJTkUudXRpbC5nZXRSYW5kb21OdW1iZXIoMzAsIDEwMCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgIHdpZHRoOiByYW5nZSxcclxuICAgICAgICAgICAgaGVpZ2h0OiByYW5nZSxcclxuICAgICAgICAgICAgc3BlZWQ6IEVOR0lORS51dGlsLmdldFJhbmRvbU51bWJlcigyLCA2KVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MucG9zWCA9IEVOR0lORS51dGlsLmdldFJhbmRvbU51bWJlcigwIC0gdGhpcy5zZXR0aW5ncy5oZWlnaHQsIEVOR0lORS5zZXR0aW5ncy5jYW52YXNXaWR0aCk7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wb3NZID0gdGhpcy5zZXR0aW5ncy5oZWlnaHQgKiAtMjtcclxuXHJcbiAgICAgICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICB0aGlzLmltZy5zcmMgPSAnQXBwL0NvbnRlbnQvSW1hZ2VzL2FzdGVyb2lkLScgKyBFTkdJTkUudXRpbC5nZXRSYW5kb21OdW1iZXIoMSwgNCkgKyAnLnBuZyc7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjb250ZXh0KSB7XHJcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMuc2V0dGluZ3MucG9zWCwgdGhpcy5zZXR0aW5ncy5wb3NZLCB0aGlzLnNldHRpbmdzLndpZHRoLCB0aGlzLnNldHRpbmdzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCkge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MucG9zWSArPSB0aGlzLnNldHRpbmdzLnNwZWVkO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQge0FzdGVyb2lkfTsiLCJpbXBvcnQge0VOR0lORX0gZnJvbSAnLi9lbmdpbmUnO1xyXG5pbXBvcnQge0FzdGVyb2lkfSBmcm9tICcuL2FzdGVyb2lkJztcclxuXHJcbmNsYXNzIEFzdGVyb2lkQ29sbGVjdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmxpc3QgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoKSB7XHJcbiAgICAgICAgbGV0IGNoZWNrQXN0ZXJvaWRCb3VuZHMgPSBmdW5jdGlvbihhc3Rlcm9pZCwgaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKGFzdGVyb2lkLnNldHRpbmdzLnBvc1kgPiBFTkdJTkUuc2V0dGluZ3MuY2FudmFzSGVpZ2h0ICsgMzApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICBsZXQgdXBkYXRlID0gZnVuY3Rpb24oYXN0ZXJvaWQpIHtcclxuICAgICAgICAgICAgYXN0ZXJvaWQudXBkYXRlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goY2hlY2tBc3Rlcm9pZEJvdW5kcyk7XHJcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2godXBkYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGNvbnRleHQpIHtcclxuICAgICAgICBsZXQgZHJhdyA9IGZ1bmN0aW9uKGFzdGVyb2lkKSB7XHJcbiAgICAgICAgICAgIGFzdGVyb2lkLmRyYXcoY29udGV4dCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goZHJhdyk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQXN0ZXJvaWQoKSB7XHJcbiAgICAgICAgdGhpcy5saXN0LnB1c2gobmV3IEFzdGVyb2lkKCkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQge0FzdGVyb2lkQ29sbGVjdGlvbn07Iiwi77u/dmFyIEVOR0lORSA9IChmdW5jdGlvbigpIHsgICAvLyBUZW1wIHVudGlsIHdlIGdldCBhIG1vZHVsZSBzeXN0ZW0gaW4gcGxhY2UgKENvbnZlcnQgdG8gYSBFUzYgbW9kdWxlKVxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGxldCBmYWN0b3J5ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNsYXNzIEdhbWUge1xyXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvcihwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUgPSBwcm9wZXJ0aWVzLnVwZGF0ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RyYXcgPSBwcm9wZXJ0aWVzLmRyYXc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0ID0gcHJvcGVydGllcy5pbml0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB1cGRhdGUoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZHJhdygpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3RhcnQoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZ2FtZUxvb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmF3KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGdhbWVMb29wKTtcclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZ2FtZUxvb3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjbGFzcyBHYW1lT2JqZWN0IHtcclxuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDUwLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNTAsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zWDogMCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NZOiAwXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVHYW1lKHVwZGF0ZSwgZHJhdykge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEdhbWUodXBkYXRlLCBkcmF3KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUdhbWVPYmplY3QoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgR2FtZU9iamVjdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY3JlYXRlR2FtZTogY3JlYXRlR2FtZSxcclxuICAgICAgICAgICAgY3JlYXRlR2FtZU9iamVjdDogY3JlYXRlR2FtZU9iamVjdFxyXG4gICAgICAgIH07XHJcbiAgICB9KCkpO1xyXG5cclxuICAgIGxldCBjb250cm9scyA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICBsZXQgZXZlbnRBY3Rpb25zID0ge307XHJcbiAgICAgICAgbGV0IGtleVN0YXRlID0ge307XHJcbiAgICAgICAgbGV0IGtleUFjdGlvbiA9IHtcclxuICAgICAgICAgICAgc3BhY2U6IGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZygnS2V5IGFjdGlvbiBzcGFjZSBub3QgZGVmaW5lZCcpOyB9LFxyXG4gICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKCdLZXkgYWN0aW9uIHBhdXNlIG5vdCBkZWZpbmVkJyk7IH0sXHJcbiAgICAgICAgICAgIGVudGVyOiBmdW5jdGlvbigpIHsgY29uc29sZS5sb2coJ0tleSBhY3Rpb24gZW50ZXIgbm90IGRlZmluZWQnKTsgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBvbiA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy5sZWZ0ID0gZnVuYztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICBldmVudEFjdGlvbnMucmlnaHQgPSBmdW5jO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndXAnOlxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy51cCA9IGZ1bmM7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICAgICAgICAgICAgICBldmVudEFjdGlvbnMuZG93biA9IGZ1bmM7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFjZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRBY3Rpb25zLmRvd24gPSBmdW5jO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAncGF1c2UnOlxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy5kb3duID0gZnVuYztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Vua25vd24gY29udHJvbCBldmVudCBmaXJlZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IG9ua2V5ID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcclxuICAgICAgICAgICAgc3dpdGNoIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnc3BhY2UnOlxyXG4gICAgICAgICAgICAgICAgICAgIGtleUFjdGlvbi5zcGFjZSA9IGZ1bmM7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdwYXVzZSc6XHJcbiAgICAgICAgICAgICAgICAgICAga2V5QWN0aW9uLnBhdXNlID0gZnVuYztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2VudGVyJzpcclxuICAgICAgICAgICAgICAgICAgICBrZXlBY3Rpb24uZW50ZXIgPSBmdW5jO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndW5rbm93biBjb250cm9sIGV2ZW50IGZpcmVkJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgY29udHJvbHNMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIChVcCBBcnJvdylcclxuICAgICAgICAgICAgaWYgKGtleVN0YXRlWzM4XSB8fCBrZXlTdGF0ZVs4N10pIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy51cCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAoTGVmdCBBcnJvdylcclxuICAgICAgICAgICAgaWYgKGtleVN0YXRlWzM3XSB8fCBrZXlTdGF0ZVs2NV0pIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy5sZWZ0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIChSaWdodCBBcnJvdylcclxuICAgICAgICAgICAgaWYgKGtleVN0YXRlWzM5XSB8fCBrZXlTdGF0ZVs2OF0pIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy5yaWdodCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAoRG93biBBcnJvdylcclxuICAgICAgICAgICAgaWYgKGtleVN0YXRlWzQwXSB8fCBrZXlTdGF0ZVs4M10pIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50QWN0aW9ucy5kb3duKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShjb250cm9sc0xvb3ApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShjb250cm9sc0xvb3ApO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAga2V5U3RhdGVbZS5rZXlDb2RlIHx8IGUud2hpY2hdID0gdHJ1ZTtcclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBrZXlTdGF0ZVtlLmtleUNvZGUgfHwgZS53aGljaF0gPSBmYWxzZTtcclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkua2V5ZG93bihmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIC8vIEVudGVyIGtleVxyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xyXG4gICAgICAgICAgICAgICAga2V5QWN0aW9uLmVudGVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIChwKSBQYXVzZVxyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSA4MCkge1xyXG4gICAgICAgICAgICAgICAga2V5QWN0aW9uLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNwYWNlIGJhclxyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAzMikge1xyXG4gICAgICAgICAgICAgICAga2V5QWN0aW9uLnNwYWNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgb246b24sXHJcbiAgICAgICAgICAgIG9ua2V5OiBvbmtleVxyXG4gICAgICAgIH07XHJcbiAgICB9KCkpO1xyXG5cclxuICAgIGxldCB1dGlsID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIF9ob3Jpem9udGFsQ29sbGlzaW9uKG9iajEsIG9iajIpIHtcclxuICAgICAgICAgICAgbGV0IG9iajFSaWdodFNpZGUgPSBvYmoxLnNldHRpbmdzLnBvc1ggKyBvYmoxLnNldHRpbmdzLndpZHRoO1xyXG4gICAgICAgICAgICBsZXQgb2JqMUxlZnRTaWRlID0gb2JqMS5zZXR0aW5ncy5wb3NYO1xyXG4gICAgICAgICAgICBsZXQgb2JqMlJpZ2h0U2lkZSA9IG9iajIuc2V0dGluZ3MucG9zWCArIG9iajIuc2V0dGluZ3Mud2lkdGg7XHJcbiAgICAgICAgICAgIGxldCBvYmoyTGVmdFNpZGUgPSBvYmoyLnNldHRpbmdzLnBvc1g7XHJcblxyXG4gICAgICAgICAgICBpZiAobGVmdFNpZGVDb2xsaXNpb24oKSB8fCByaWdodFNpZGVDb2xsaXNpb24oKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGxlZnRTaWRlQ29sbGlzaW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKChvYmoxTGVmdFNpZGUgPj0gb2JqMkxlZnRTaWRlICYmIG9iajFMZWZ0U2lkZSA8PSBvYmoyUmlnaHRTaWRlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJpZ2h0U2lkZUNvbGxpc2lvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvYmoxUmlnaHRTaWRlID49IG9iajJMZWZ0U2lkZSAmJiBvYmoxUmlnaHRTaWRlIDw9IG9iajJSaWdodFNpZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfdmVydGljYWxQb3NpdGlvbihvYmoxLCBvYmoyKSB7XHJcbiAgICAgICAgICAgIGlmIChjaGVja1RvcFNpZGVDb2xsaXNpb24oKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrVG9wU2lkZUNvbGxpc2lvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAob2JqMS5zZXR0aW5ncy5wb3NZID49IG9iajIuc2V0dGluZ3MucG9zWSAmJiBvYmoxLnNldHRpbmdzLnBvc1kgPD0gb2JqMi5zZXR0aW5ncy5wb3NZICsgb2JqMi5zZXR0aW5ncy5oZWlnaHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjaGVja0NvbGxpc2lvbihvYmoxLCBvYmoyKSB7XHJcbiAgICAgICAgICAgIGlmIChfaG9yaXpvbnRhbENvbGxpc2lvbihvYmoxLCBvYmoyKSAmJiBfdmVydGljYWxQb3NpdGlvbihvYmoxLCBvYmoyKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFJhbmRvbU51bWJlcihtaW4sIG1heCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFJhbmRvbUNvbG9yKCkge1xyXG4gICAgICAgICAgICBsZXQgbGV0dGVycyA9ICcwMTIzNDU2Nzg5QUJDREVGJy5zcGxpdCgnJyk7XHJcbiAgICAgICAgICAgIGxldCBjb2xvciA9ICcjJztcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb2xvciArPSBsZXR0ZXJzW01hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDE1KV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNoZWNrQ29sbGlzaW9uOiBjaGVja0NvbGxpc2lvbixcclxuICAgICAgICAgICAgZ2V0UmFuZG9tTnVtYmVyOiBnZXRSYW5kb21OdW1iZXIsXHJcbiAgICAgICAgICAgIGdldFJhbmRvbUNvbG9yOiBnZXRSYW5kb21Db2xvclxyXG4gICAgICAgIH07XHJcbiAgICB9KCkpO1xyXG5cclxuICAgIGxldCBzZXR0aW5ncyA9IHtcclxuICAgICAgICBjYW52YXNXaWR0aDogNzIwLFxyXG4gICAgICAgIGNhbnZhc0hlaWdodDogNDgwXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdXRpbDogdXRpbCxcclxuICAgICAgICBmYWN0b3J5OiBmYWN0b3J5LFxyXG4gICAgICAgIGNvbnRyb2xzOiBjb250cm9scyxcclxuICAgICAgICBzZXR0aW5nczogc2V0dGluZ3NcclxuICAgIH07XHJcbn0oKSk7XHJcblxyXG5leHBvcnQge0VOR0lORX07IiwiY2xhc3MgTGFzZXIge1xyXG4gICAgY29uc3RydWN0b3IgKG9yaWdpblgsIG9yaWdpblkpIHtcclxuICAgICAgICB0aGlzLnNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICBwb3NYOiBvcmlnaW5YLFxyXG4gICAgICAgICAgICBwb3NZOiBvcmlnaW5ZLFxyXG4gICAgICAgICAgICB3aWR0aDogNC41LFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDI1XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zb3VuZCA9IG5ldyB3aW5kb3cuSG93bCh7XHJcbiAgICAgICAgICAgIHVybHM6IFsnQXBwL0NvbnRlbnQvQXVkaW8vbGFzZXIubXAzJ11cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGNvbnRleHQpIHtcclxuICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyMwMGZmMDAnOyAvL0VOR0lORS51dGlsLmdldFJhbmRvbUNvbG9yKCk7XHJcbiAgICAgICAgY29udGV4dC5hcmModGhpcy5zZXR0aW5ncy5wb3NYLCB0aGlzLnNldHRpbmdzLnBvc1ksIHRoaXMuc2V0dGluZ3Mud2lkdGgsIHRoaXMuc2V0dGluZ3MuaGVpZ2h0LCBNYXRoLlBJICogMiwgdHJ1ZSk7XHJcbiAgICAgICAgY29udGV4dC5maWxsKCk7XHJcbiAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wb3NZIC09IDUuMDU7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheVNvdW5kKCkge1xyXG4gICAgICAgIHRoaXMuc291bmQucGxheSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQge0xhc2VyfTsiLCJpbXBvcnQge0xhc2VyfSBmcm9tICcuL2xhc2VyJztcclxuXHJcbmNsYXNzIExhc2VyQ29sbGVjdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm1heExhc2VycyA9IDEwO1xyXG4gICAgICAgIHRoaXMubGlzdCA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZSgpIHtcclxuICAgICAgICBsZXQgdXBkYXRlTGFzZXIgPSBmdW5jdGlvbihsYXNlciwgaW5kZXgpIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0W2luZGV4XS51cGRhdGUoKTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIGxldCBjaGVja0xhc2VyQm91bmRzID0gZnVuY3Rpb24obGFzZXIsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RbaW5kZXhdLnNldHRpbmdzLnBvc1kgPCAtNSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0LnNoaWZ0KCk7IC8vIElmIGxhc2VyIG91dHNpZGUgb2YgdG9wIGJvdW5kcyByZW1vdmUgZnJvbSBhcnJheVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaChjaGVja0xhc2VyQm91bmRzKTtcclxuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaCh1cGRhdGVMYXNlcik7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjb250ZXh0KSB7XHJcbiAgICAgICAgbGV0IGRyYXcgPSBmdW5jdGlvbihsYXNlcikge1xyXG4gICAgICAgICAgICBsYXNlci5kcmF3KGNvbnRleHQpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMubGlzdC5mb3JFYWNoKGRyYXcpO1xyXG4gICAgfVxyXG5cclxuICAgIGZpcmUocG9zWCwgcG9zWSkge1xyXG4gICAgICAgIGlmICh0aGlzLmxpc3QubGVuZ3RoIDwgdGhpcy5tYXhMYXNlcnMpIHtcclxuICAgICAgICAgICAgbGV0IGxhc2VyID0gbmV3IExhc2VyKHBvc1gsIHBvc1kpO1xyXG4gICAgICAgICAgICBsYXNlci5wbGF5U291bmQoKTtcclxuICAgICAgICAgICAgdGhpcy5saXN0LnB1c2gobGFzZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHtMYXNlckNvbGxlY3Rpb259OyIsImltcG9ydCB7RU5HSU5FfSBmcm9tICcuL2VuZ2luZSc7XHJcblxyXG5jbGFzcyBTaGlwIHtcclxuICAgIGNvbnN0cnVjdG9yKHByb3BlcnRpZXMpIHtcclxuICAgICAgICB0aGlzLmxhc2VycyA9IHByb3BlcnRpZXMubGFzZXJzO1xyXG5cclxuICAgICAgICB0aGlzLnNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICBjb2xvcjogJ3JnYmEoMCwgMCwgMCwgMSknLFxyXG4gICAgICAgICAgICBwb3NYOiAyNSxcclxuICAgICAgICAgICAgcG9zWTogMzUwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDI1LFxyXG4gICAgICAgICAgICB3aWR0aDogMjUsXHJcbiAgICAgICAgICAgIHNwZWVkOiA0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICB0aGlzLmltZy5zcmMgPSAnQXBwL0NvbnRlbnQvSW1hZ2VzL3NwYWNlc2hpcC5wbmcnO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY29udGV4dCkge1xyXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRoaXMuaW1nLCB0aGlzLnNldHRpbmdzLnBvc1gsIHRoaXMuc2V0dGluZ3MucG9zWSk7XHJcbiAgICAgICAgdGhpcy5sYXNlcnMuZHJhdyhjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5sYXNlcnMudXBkYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZmlyZSgpIHtcclxuICAgICAgICB0aGlzLmxhc2Vycy5maXJlKHRoaXMuc2V0dGluZ3MucG9zWCArIDIzLCB0aGlzLnNldHRpbmdzLnBvc1kgLSA1KTtcclxuICAgIH1cclxuXHJcbiAgICBtb3ZlTGVmdCgpIHtcclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5wb3NYID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLnBvc1ggPSB0aGlzLnNldHRpbmdzLnBvc1ggLSB0aGlzLnNldHRpbmdzLnNwZWVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlUmlnaHQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucG9zWCArIHRoaXMuc2V0dGluZ3Mud2lkdGggPCBFTkdJTkUuc2V0dGluZ3MuY2FudmFzV2lkdGggKyA3MCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLnBvc1ggPSB0aGlzLnNldHRpbmdzLnBvc1ggKyB0aGlzLnNldHRpbmdzLnNwZWVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlVXAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucG9zWSA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5wb3NZID0gdGhpcy5zZXR0aW5ncy5wb3NZIC0gdGhpcy5zZXR0aW5ncy5zcGVlZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZURvd24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucG9zWSA8IEVOR0lORS5zZXR0aW5ncy5jYW52YXNIZWlnaHQgLSA0MCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLnBvc1kgPSB0aGlzLnNldHRpbmdzLnBvc1kgKyB0aGlzLnNldHRpbmdzLnNwZWVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHtTaGlwfTsiXX0=
