import fs from 'fs';
import React from 'react';
import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import CardGroup from 'react-bootstrap/CardGroup';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import { getLogger } from '../../logger';

const logger = getLogger(__filename.split('/').slice(-2).join('/'));

/**
 * Renders a table of buttons for each invest model and
 * a list of cards for each cached invest job.
 */
export default class HomeTab extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    const { value } = event.target;
    const { investList, openInvestModel } = this.props;
    const modelRunName = investList[value].internal_name;
    openInvestModel(modelRunName, value);
  }

  render() {
    const { investList, recentJobs } = this.props;
    // A button in a table row for each model
    const investButtons = [];
    Object.keys(investList).forEach((model) => {
      investButtons.push(
        <tr key={model}>
          <td>
            <Button
              className="invest-button"
              block
              size="lg"
              value={model}
              onClick={this.handleClick}
              variant="link"
            >
              {model}
            </Button>
          </td>
        </tr>
      );
    });

    return (
      <Row>
        <Col md={5} className="invest-list-table">
          <Table size="sm">
            <tbody>
              {investButtons}
            </tbody>
          </Table>
        </Col>
        <Col md={7} className="recent-job-card-group">
          <RecentInvestJobs
            openInvestModel={this.props.openInvestModel}
            recentJobs={recentJobs}
          />
        </Col>
      </Row>
    );
  }
}

HomeTab.propTypes = {
  investList: PropTypes.objectOf(
    PropTypes.shape({
      internal_name: PropTypes.string,
    }),
  ).isRequired,
  openInvestModel: PropTypes.func.isRequired,
  recentJobs: PropTypes.arrayOf(
    PropTypes.array
  ),
};
HomeTab.defaultProps = {
  recentJobs: [],
};

/**
 * Renders a button for each recent invest job.
 */
class RecentInvestJobs extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(jobDataPath) {
    const jobData = JSON.parse(
      fs.readFileSync(jobDataPath, 'utf8')
    );
    this.props.openInvestModel(
      jobData.modelRunName,
      jobData.modelHumanName,
      jobData.argsValues,
      jobData.logfile,
      jobData.status,
    );
  }

  render() {
    // Buttons to load each recently saved state
    const recentButtons = [];
    const { recentJobs } = this.props;
    recentJobs.forEach((job) => {
      let model;
      let workspaceDir;
      let jobDataPath;
      const [jobID, metadata] = job;
      // The following properties are required. If they don't exist,
      // the recent job's data was corrupted and should be skipped over.
      if (jobID === undefined) { return; }
      try {
        model = metadata.model;
        workspaceDir = metadata.workspace.directory;
        jobDataPath = metadata.jobDataPath;
      } catch (error) {
        logger.error(error);
        return;
      }

      // These are optional and the rest of the render method
      // should be robust to undefined values
      const { suffix } = metadata.workspace;
      const { status, description, humanTime } = metadata;

      recentButtons.push(
        <Card
          className="text-left recent-job-card"
          as="button"
          key={jobID}
          onClick={() => this.handleClick(jobDataPath)}
        >
          <Card.Body>
            <Card.Header as="h4">
              {model}
              {status === 'running'
                && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                )
              }
            </Card.Header>
            <Card.Title>
              <span className="text-heading">{'Workspace: '}</span>
              <span className="text-mono">{workspaceDir}</span>
            </Card.Title>
            <Card.Title>
              <span className="text-heading">{'Suffix: '}</span>
              <span className="text-mono">{suffix}</span>
            </Card.Title>
            <Card.Text>{description || <em>no description</em>}</Card.Text>
            <Card.Footer className="text-muted">{humanTime}</Card.Footer>
          </Card.Body>
        </Card>
      );
    });

    return (
      <Container>
        <h4 id="recent-job-card-group">
          Recent InVEST Runs:
        </h4>
        {recentButtons.length
          ? (
            <CardGroup
              aria-labelledby="recent-job-card-group"
              // className="recent-job-card-group"
            >
              {recentButtons}
            </CardGroup>
          )
          : (
            <div>
              No recent InVEST runs yet.
              <br />
              Try the <b>Load</b> button to load a sample data json file
            </div>
          )}
      </Container>
    );
  }
}

RecentInvestJobs.propTypes = {
  recentJobs: PropTypes.array.isRequired,
};
