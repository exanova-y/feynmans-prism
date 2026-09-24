// Single source of truth for names and problems. Every client (pear, agent
// stirrer, orchestrator --join) reads from here.
//
// `title` is short for the terminal; `statement` is the Emergent Mind open
// problem verbatim. Subproblems come from the research tree run in
// tools/outputs (credit-assignment only so far).

// Device names from DESIGN.md. A pear picks one at random on first run and
// keeps it in its identity file.
export const DEVICE_NAMES = [
  'Nonacris',
  'Eridanus',
  'Corinth',
  'Mitylene',
  'Pyrenees',
  'Thrace',
  'Inachos',
  'Diana',
  'Jupiter',
  'Saturnia',
  'Naiad',
  'Nereid',
  'Erymanthus',
  'Coronis',
  'Nyctimene',
  'Thessaly',
  'Vulcan',
  'Lemnos',
  'Tyrrhenian',
]

export interface Subproblem {
  text: string
  tokens: number | null
}

export interface Problem {
  id: string
  title: string
  statement: string
  tokens: number | null
  subproblems: Subproblem[]
}

const q = (text: string): Subproblem => ({ text, tokens: null })
export const PLACEHOLDER: Subproblem[] = [q('Not yet extracted — populate from a future run.')]

export const PROBLEMS: Problem[] = [
  {
    id: 'credit-assignment',
    title: 'Biological credit assignment',
    statement:
      'Establish effective methodologies to improve, scale, and rigorously test the capabilities of biologically plausible credit assignment algorithms, including predictive coding, contrastive Hebbian learning, and forward-only learning, and develop experimental protocols to empirically verify the specific claims these algorithms imply about cortical processing.',
    tokens: 50000,
    subproblems: [
      q(
        'What are the fundamental causes of the performance and scalability gap between forward-only algorithms and backpropagation, particularly regarding layer collaboration during training?',
      ),
      q(
        'Can weight mirroring strategies be meaningfully extended to convolutional architectures beyond fully connected networks?',
      ),
      q(
        'How can the temporal non-locality of PEPITA (requirement to retain first-pass information until second pass) be reconciled with biological plausibility, and what neuromodulatory signals could distinguish the two passes?',
      ),
      q(
        'Can a learning rule be developed that relaxes the full set of backpropagation assumptions (weight transport, update locking, global error signals) while maintaining deep-learning scalability and task performance comparable to modern supervised learning?',
      ),
      q(
        'How can neuromorphic substrates be leveraged to scale deep credit assignment beyond local plasticity rules, and what would the substrate-level mechanism need to accomplish?',
      ),
      q(
        'Which sparse configurations in the joint taxonomy (state-dynamics × credit-assignment) represent genuine research gaps versus conceptual incompatibilities or taxonomy artifacts?',
      ),
      q(
        'Do the resource-allocation properties of constrained Hebbian learning extend to fully unprocessed multimodal inputs and beyond audiovisual domains to text, graphs, and tabular data?',
      ),
      q(
        'Are the low-CTI representations induced by constrained Hebbian learning also more selective, disentangled, or interpretable than backpropagation or DDTP-trained representations?',
      ),
      q(
        'How do local Hebbian mechanisms perform when combined with recurrent, spiking, and inhibitory–excitatory architectures, and what additional stabilization mechanisms enable scaling beyond shallow networks?',
      ),
      q(
        'Can local Hebbian learning achieve comparable resource-allocation efficiency when integrated with feedback-driven allocation of representational resources or synaptic tagging mechanisms?',
      ),
    ],
  },
  {
    // Proposed by the project owner (not Emergent Mind), for the acoustics
    // work; the first decomposition is a starter for the graph to reshape.
    id: 'transducer-coverage',
    title: 'Transducer placement for 360° brain coverage',
    statement:
      'Design the placement of ultrasound transducers on the head that minimizes resources (element count, aperture, power) while every steering angle within the brain, across all 360 degrees, can be reached with a usable focus.',
    tokens: null,
    subproblems: [
      q(
        'Which array geometries (hemispherical, ring, conformal patches) reach every steering angle through the skull with the fewest elements?',
      ),
      q(
        'How do skull thickness and porosity bound the angles at which a focus can form, and where are the acoustic windows that relax that bound?',
      ),
      q(
        'What minimum element count and aperture give a usable focal spot at each target depth and angle, and how does the answer change with frequency?',
      ),
      q(
        'Can placement be posed as coverage optimization (greedy set cover or integer programming over candidate scalp positions) with a per-angle steering constraint?',
      ),
      q(
        'What simulation fidelity (ray tracing versus full-wave k-Wave) is adequate to rank placements, and can a surrogate model stand in for full-wave runs?',
      ),
      q(
        'How much coverage lost to skull aberration does per-element phase and amplitude correction recover, compared with adding elements?',
      ),
      q('How do thermal and cavitation safety limits constrain the resource-minimal placement?'),
    ],
  },
  {
    id: 'poincare-inequality',
    title: 'Subspace conditional Poincaré inequality',
    statement:
      'Establish the subspace conditional Poincaré inequality for general finite-rank orthogonal projectors under infinite-dimensional uniform product measures, thereby converting active-subspace tail-energy bounds for affine uniform elliptic PDEs into ridge-reconstruction error bounds.',
    tokens: null,
    subproblems: PLACEHOLDER,
  },
  {
    id: 'spiked-thresholds',
    title: 'Spiked tensor detection thresholds',
    statement:
      'Determine rigorous signal detection thresholds for spiked models as a function of data type; specifically, establish precise detectability conditions for low-rank signals embedded in high-dimensional noise for spiked matrix and spiked tensor settings.',
    tokens: null,
    subproblems: PLACEHOLDER,
  },
  {
    id: 'noise-capacity',
    title: 'Noise reduction information capacity',
    statement:
      'Determine how to predict, from the original noisy data, the information processing capacity that will result after applying noise-reduction strategies such as averaging repeated state traces.',
    tokens: null,
    subproblems: PLACEHOLDER,
  },
  {
    id: 'degeneracy',
    title: 'Temporal mutual-information degeneracy',
    statement:
      'Establish whether the original temporal mutual-information analysis of degeneracy can be applied to neuromechanical models that exhibit a stationary regime.',
    tokens: null,
    subproblems: PLACEHOLDER,
  },
]
