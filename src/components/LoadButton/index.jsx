import React from 'react';
import { remote } from 'electron'; // eslint-disable-line import/no-extraneous-dependencies
import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import InvestJob from '../../InvestJob';
import { fetchDatastackFromFile } from '../../server_requests';
import { dragOverHandlerNone } from '../../utils';

/**
 * Render a button that loads args from a datastack, parameterset, or logfile.
 * Opens a native OS filesystem dialog to browse to a file.
 */
export default class LoadButton extends React.Component {
  constructor(props) {
    super(props);
    this.browseFile = this.browseFile.bind(this);
  }

  async browseFile(event) {
    const data = await remote.dialog.showOpenDialog();
    if (data.filePaths.length) {
      const datastack = await fetchDatastackFromFile(data.filePaths[0]);
      const job = new InvestJob({
        modelRunName: datastack.model_run_name,
        modelHumanName: datastack.model_human_name,
        argsValues: datastack.args
      });
      this.props.openInvestModel(job);
    }
  }

  render() {
    const tipText = 'Browse to a datastack (.json) or invest logfile (.txt)';
    return (
      <OverlayTrigger
        placement="left"
        delay={{ show: 250, hide: 400 }}
        overlay={<Tooltip>{tipText}</Tooltip>}
      >
        <Button
          className="mx-3"
          onClick={this.browseFile}
          variant="outline-dark"
          onDragOver={dragOverHandlerNone}
        >
          Open
        </Button>
      </OverlayTrigger>
    );
  }
}

LoadButton.propTypes = {
  openInvestModel: PropTypes.func.isRequired,
};
