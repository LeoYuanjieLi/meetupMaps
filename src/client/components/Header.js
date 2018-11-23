import React from 'react';
import PropTypes from 'prop-types';

const Header = ({ message }) => {
    return (
        <h1 className="Header text-center">
            {message}
        </h1>
    );
};

Header.propTypes = {
    message: PropTypes.string
};

export default Header;