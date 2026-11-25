// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC20 mock for local tests only. Not for deployment.
contract MockERC20 {
    string public name = "Mock tUSD8";
    string public symbol = "tUSD8";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external virtual returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

/// @notice Token that tries to re-enter AevumGuard.pay() during transfer().
///         Used by test A23: the inner call must fail (nonReentrant) and the
///         outer payment must settle exactly once.
interface IGuardPay {
    function pay(address recipient, uint256 amount, bytes32 category) external;
}

contract ReentrantToken is MockERC20 {
    address public guard;
    address public attackRecipient;
    bytes32 public attackCategory;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    function arm(address _guard, address _recipient, bytes32 _category) external {
        guard = _guard;
        attackRecipient = _recipient;
        attackCategory = _category;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        if (guard != address(0) && !reentryAttempted && msg.sender == guard) {
            reentryAttempted = true;
            try IGuardPay(guard).pay(attackRecipient, amount, attackCategory) {
                reentrySucceeded = true;
            } catch {
                reentrySucceeded = false;
            }
        }
        _move(msg.sender, to, amount);
        return true;
    }
}
