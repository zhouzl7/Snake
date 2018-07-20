/**Created by the LayaAirIDE*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var view;
(function (view) {
    var GameView = /** @class */ (function (_super) {
        __extends(GameView, _super);
        function GameView() {
            var _this = _super.call(this) || this;
            _this.gameScrollSpeed = 4;
            _this.directCollision = false;
            _this.score = 0;
            /* for debug */
            _this.debugInfo = new Laya.Text();
            _this.debugInfo.width = 300;
            _this.debugInfo.font = "Hei";
            _this.debugInfo.fontSize = 20;
            _this.debugInfo.color = "white";
            _this.addChild(_this.debugInfo);
            _this.scoreDisplay = new Laya.Text();
            _this.scoreDisplay.width = 100;
            _this.scoreDisplay.pos(Const.SCREEN_WIDTH - 25, 0);
            _this.scoreDisplay.font = 'Arial';
            _this.scoreDisplay.fontSize = 40;
            _this.scoreDisplay.color = "white";
            _this.scoreDisplay.text = _this.score.toString();
            _this.addChild(_this.scoreDisplay);
            _this.blocks = new Array();
            _this.latestBlocks = new Array();
            _this.snakeAdds = new Array();
            _this.latestSnakeAdds = new Array();
            _this.walls = new Array();
            return _this;
        }
        GameView.prototype.setDebugInfo = function (msg) {
            this.debugInfo.text = msg;
        };
        GameView.prototype.startGame = function () {
            this.snake = new sprite.Snake();
            Laya.stage.addChild(this.snake);
            this.lastMouseX = Laya.stage.mouseX;
            this.snake.pos(0, 0);
            Laya.timer.frameLoop(1, this, this.mainLoop, null, false); // Every Frame
            this.snake.extendBody(15);
            Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
            Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onMouseUp);
            // Laya.timer.frameLoop(100, this, this.updateBlocksStatus);//每300帧添加进行游戏状态更新，添加Block
            Laya.timer.frameOnce(100, this, this.updateBlocks_WALLStatus); //每个随机帧数添加进行游戏状态更新，添加Block、Wall
            //Laya.timer.frameOnce(100, this, this.updateWallsStatus);//每个随机帧数添加进行游戏状态更新，添加Wall
            Laya.timer.frameOnce(80, this, this.updateSnakeAddsStatus); //每个随机帧添加进行游戏状态更新，添加SnakeAdd
            Laya.timer.frameLoop(300, this.snake, this.snake.updateHeadHistory);
            Laya.timer.frameLoop(2, this.snake, this.snake.showBody);
        };
        GameView.prototype.onMouseDown = function () {
            this.mouseDown = true;
        };
        GameView.prototype.onMouseUp = function () {
            this.mouseDown = false;
            this.debugInfo.text = 'mouseup';
        };
        GameView.prototype.updateScore = function () {
            this.scoreDisplay.text = this.score.toString();
            if (this.score > 0) {
                var offset = Math.floor(Math.log(this.score) / Math.log(10));
                this.scoreDisplay.pos(Const.SCREEN_WIDTH - 25 * (offset + 1), 0);
            }
        };
        // The Main Loop for the game 
        GameView.prototype.mainLoop = function () {
            console.log('--Main Loop begin---');
            this.updateScore();
            this.detectMouseMove();
            this.snake.updateBody();
            this.updateBlocks();
            this.updateSnakeAdds();
            this.updateWalls();
            this.updateCollisionDetection();
        };
        // 检测触点移动情况
        GameView.prototype.detectMouseMove = function () {
            var currentMouseX = Laya.stage.mouseX;
            if (this.mouseDown) {
                var level = 1;
                if (Math.abs(currentMouseX - this.lastMouseX) > 20) {
                    level = 40;
                }
                else {
                    level = Math.abs(currentMouseX - this.lastMouseX) * 2;
                }
                if (currentMouseX < this.lastMouseX) {
                    this.snake.moveLeft(level);
                }
                else if (currentMouseX > this.lastMouseX) {
                    this.snake.moveRight(level);
                }
            }
            this.lastMouseX = currentMouseX;
        };
        // 是否是正在正面碰撞
        GameView.prototype.isDirectCollision = function () {
            return this.directCollision;
        };
        // 更新方块集合Blocks
        GameView.prototype.updateBlocks_WALLStatus = function () {
            //添加隔板
            var wallNumber = Common.getRandomArrayElements(Const.WALL_NUMBERS, 1);
            if (wallNumber[0] > 0) {
                var orders = Common.getRandomArrayElements([1, 2, 3, 4], wallNumber[0]);
                for (var i = 0; i < wallNumber[0]; i++) {
                    var w = new sprite.Wall();
                    w.setPos(orders[i] * 82.8 + 37.2, -Const.BLOCK_WIDTH * 3 - 1.5);
                    this.walls.push(w);
                    this.addChildren(w);
                }
            }
            var blockNumber = Common.getRandomArrayElements(Const.BLOCK_NUMBERS, 1);
            if (blockNumber[0] > 0) {
                var orders = Common.getRandomArrayElements([0, 1, 2, 3, 4], blockNumber[0]);
                this.latestBlocks.splice(0, this.latestBlocks.length); //清空
                for (var i = 0; i < blockNumber[0]; i++) {
                    var b = new sprite.Block();
                    b.setPos(orders[i] * 82.8 + 41, -Const.BLOCK_WIDTH * 4);
                    //检测当前位置是否存在SnakeAdd
                    var Flag = false;
                    for (var j = 0; j < this.latestSnakeAdds.length; j++) {
                        var add = this.latestSnakeAdds[j];
                        var x1 = b.PosX;
                        var y1 = b.PosY;
                        var x2 = add.PosX;
                        var y2 = add.PosY;
                        var calx = x1 - x2;
                        var caly = y1 - y2;
                        var dis = Math.pow(calx * calx + caly * caly, 0.5);
                        if (dis <= (Const.BLOCK_MIN_CIRCLE_R + Const.SNAKE_BODY_RADIUS * 2)) {
                            b.destory();
                            Flag = true;
                            break;
                        }
                    }
                    if (Flag) {
                        continue;
                    }
                    //当前位置不存在SnakeAdd，则...
                    this.blocks.push(b);
                    this.latestBlocks.push(b);
                    this.addChildren(b);
                }
            }
            var nextTimeNewBlocks = Common.getRandomArrayElements(Const.BLOCK_WALL_NEWTIMES, 1);
            Laya.timer.frameOnce(nextTimeNewBlocks[0], this, this.updateBlocks_WALLStatus); //每个随机帧数添加进行游戏状态更新，添加Block
        };
        // 更新Grow集合SnakeAdds
        GameView.prototype.updateSnakeAddsStatus = function () {
            var snakeAddNumber = Common.getRandomArrayElements(Const.SNAKE_ADD_NUMBERS, 1);
            if (snakeAddNumber[0] > 0) {
                var orders = Common.getRandomArrayElements([0, 1, 2, 3, 4], snakeAddNumber[0]);
                this.latestSnakeAdds.splice(0, this.latestSnakeAdds.length); //清空
                for (var i = 0; i < snakeAddNumber[0]; i++) {
                    var add = new sprite.SnakeAdd();
                    add.setPos(orders[i] * 82.8 + 41, -Const.BLOCK_WIDTH * 4);
                    //检测当前位置是否存在Block
                    var Flag = false;
                    for (var j = 0; j < this.latestBlocks.length; j++) {
                        var block = this.latestBlocks[j];
                        var x1 = block.PosX;
                        var y1 = block.PosY;
                        var x2 = add.PosX;
                        var y2 = add.PosY;
                        var calx = x1 - x2;
                        var caly = y1 - y2;
                        var dis = Math.pow(calx * calx + caly * caly, 0.5);
                        if (dis <= (Const.BLOCK_MIN_CIRCLE_R + Const.SNAKE_BODY_RADIUS * 2)) {
                            add.destory();
                            Flag = true;
                            break;
                        }
                    }
                    if (Flag) {
                        continue;
                    }
                    //当前位置不存在Block，则...
                    this.snakeAdds.push(add);
                    this.latestSnakeAdds.push(add);
                    this.addChildren(add);
                }
            }
            var nextTimeNewAdds = Common.getRandomArrayElements(Const.SNAKE_ADD_NEWTIMES, 1);
            Laya.timer.frameOnce(nextTimeNewAdds[0], this, this.updateSnakeAddsStatus); //每个随机帧添加进行游戏状态更新，添加SnakeAdd	
        };
        // 更新碰撞检测信息
        GameView.prototype.updateCollisionDetection = function () {
            var _this = this;
            this.snakeAdds.forEach(function (snakeAdd) {
                if (Math.pow((snakeAdd.PosX - _this.snake.bodyPosX[0]), 2) + Math.pow((snakeAdd.PosY - _this.snake.bodyPosY[0]), 2) < Math.pow(Const.SNAKE_BODY_RADIUS, 2) * 4) {
                    _this.snake.extendBody(snakeAdd.getValue());
                    snakeAdd.destory();
                    _this.snakeAdds.splice(_this.snakeAdds.indexOf(snakeAdd), 1);
                }
            });
            // let snakeHead = new Laya.Rectangle();
            // snakeHead.x = this.snake.bodyPosX[0] - Const.SNAKE_BODY_RADIUS;
            // snakeHead.y = this.snake.bodyPosY[0] - Const.SNAKE_BODY_RADIUS;
            // snakeHead.width = snakeHead.height = 2 * Const.SNAKE_BODY_RADIUS;
            this.directCollision = false;
            this.blocks.forEach(function (block) {
                //console.log();
                // if (block.getBounds().intersection(snakeHead)) {
                // 	console.log('Collision');
                // }
                if (block.PosX - Const.BLOCK_WIDTH / 2 <= _this.snake.bodyPosX[0]
                    && block.PosX + Const.BLOCK_WIDTH / 2 >= _this.snake.bodyPosX[0]
                    && Math.abs(block.PosY - _this.snake.bodyPosY[0]) < (Const.BLOCK_WIDTH / 2 + Const.SNAKE_BODY_RADIUS + 1)) {
                    _this.directCollision = true;
                    if (!block.decreaseValue()) {
                        console.log('#destory block');
                        block.destory();
                        _this.blocks.splice(_this.blocks.indexOf(block), 1);
                    }
                }
            });
        };
        // 更新方块状态
        GameView.prototype.updateBlocks = function () {
            var _this = this;
            this.blocks.forEach(function (block) {
                if (!_this.isDirectCollision()) {
                    block.PosY += _this.gameScrollSpeed;
                }
                block.update();
                if ((block.PosY - (Const.BLOCK_WIDTH >> 1)) > Const.SCREEN_HEIGHT) {
                    block.destory();
                    console.log('destory block');
                    _this.blocks.splice(_this.blocks.indexOf(block), 1);
                }
            });
        };
        // 更新SnakeAdd状态
        GameView.prototype.updateSnakeAdds = function () {
            var _this = this;
            this.snakeAdds.forEach(function (snakeAdd) {
                if (!_this.isDirectCollision()) {
                    snakeAdd.PosY += _this.gameScrollSpeed;
                    snakeAdd.update();
                }
                if ((snakeAdd.PosY - Const.SNAKE_BODY_RADIUS * 2) > Const.SCREEN_HEIGHT) {
                    snakeAdd.destory();
                    console.log('destory snakeAdd');
                    _this.snakeAdds.splice(_this.snakeAdds.indexOf(snakeAdd), 1);
                }
            });
        };
        // 更新隔板状态
        GameView.prototype.updateWalls = function () {
            var _this = this;
            this.walls.forEach(function (wall) {
                if (!_this.isDirectCollision()) {
                    wall.PosY += _this.gameScrollSpeed;
                    wall.update();
                }
                if ((wall.PosY - (Const.BLOCK_WIDTH >> 1)) > Const.SCREEN_HEIGHT) {
                    wall.destory();
                    console.log('destory wall');
                    _this.walls.splice(_this.walls.indexOf(wall), 1);
                }
            });
        };
        return GameView;
    }(ui.GameViewUI));
    view.GameView = GameView;
})(view || (view = {}));
//# sourceMappingURL=GameView.js.map